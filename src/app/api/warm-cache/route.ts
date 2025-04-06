// src/app/api/warm-cache/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { loadBlogPostsServer } from '@/app/utils/loadBlogServer';

// Function to fetch and warm a single URL cache
async function warmUrl(url: string) {
  try {
    console.log(`Warming cache for: ${url}`);
    const response = await fetch(url, { 
      method: 'GET',
      cache: 'no-store',
      headers: { 'X-Cache-Warmer': 'true' }
    });
    return {
      url,
      status: response.status,
      ok: response.ok
    };
  } catch (error) {
    console.error(`Error warming ${url}:`, error);
    return {
      url,
      status: 500,
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// POST handler - handles cache warming requests
export async function POST(request: NextRequest) {
  console.log('POST request to /api/warm-cache');
  
  // Use your environment variable or a fallback for the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    
    // Validate the secret token
    if (body.secret !== secretToken && body.token !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the base URL (using request headers or your site's URL)
    const origin = request.headers.get('origin') || 
                  body.origin ||
                  process.env.NEXT_PUBLIC_SITE_URL ||
                  'https://www.writeaway.blog';
    
    // Start with main pages
    const urlsToWarm = [
      `${origin}/`,
      `${origin}/blog`
    ];
    
    // IMPORTANT: Fetch all blog posts directly from CSV using your server function
    console.log("Loading all blog posts from CSV for cache warming...");
    try {
      // Using your existing server function to get posts
      const allPosts = await loadBlogPostsServer();
      console.log(`Found ${allPosts.length} blog posts to warm`);
      
      // Add each post URL to warming list
      allPosts.forEach(post => {
        if (post.slug) {
          urlsToWarm.push(`${origin}/blog/${post.slug}`);
        }
      });
    } catch (error) {
      console.error("Failed to load posts from CSV:", error);
      return NextResponse.json(
        { error: "Failed to load posts from CSV", details: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
    
    // If specific paths are provided, add them too
    if (body.paths && Array.isArray(body.paths)) {
      body.paths.forEach((path: string) => {
        if (path.startsWith('/')) {
          urlsToWarm.push(`${origin}${path}`);
        } else {
          urlsToWarm.push(path);
        }
      });
    }
    
    console.log(`Starting cache warming for ${urlsToWarm.length} URLs...`);
    
    // Warm URLs in batches to avoid overwhelming the server
    const results = [];
    const batchSize = 5; // Process 5 URLs at a time
    
    for (let i = 0; i < urlsToWarm.length; i += batchSize) {
      const batch = urlsToWarm.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(url => warmUrl(url)));
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < urlsToWarm.length) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    // Generate report
    const successful = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;
    
    console.log(`Cache warming complete: ${successful} successful, ${failed} failed`);
    
    return NextResponse.json({
      success: true,
      total: results.length,
      successful,
      failed,
      results
    });
  } catch (error) {
    console.error('Error processing warm cache request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}