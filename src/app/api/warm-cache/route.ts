export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

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
                   'https://slm-vercel-blog-git-main-serdar-salims-projects.vercel.app';
    
    // Define pages to warm - start with main pages
    const urlsToWarm = [
      `${origin}/`,
      `${origin}/blog`
    ];
    
    // If specific paths are provided, add them
    if (body.paths && Array.isArray(body.paths)) {
      body.paths.forEach((path: string) => {
        if (path.startsWith('/')) {
          urlsToWarm.push(`${origin}${path}`);
        } else {
          urlsToWarm.push(`${origin}/${path}`);
        }
      });
    }
    
    // Warm all the URLs in parallel
    console.log(`Starting cache warming for ${urlsToWarm.length} URLs...`);
    const results = await Promise.all(
      urlsToWarm.map(url => warmUrl(url))
    );
    
    const success = results.every(r => r.ok);
    const successCount = results.filter(r => r.ok).length;
    
    return NextResponse.json({
      success: success,
      message: `Cache warming ${success ? 'completed' : 'partially completed'}`,
      warmed: successCount,
      total: urlsToWarm.length,
      results: results
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error processing warm-cache request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  console.log('OPTIONS request to /api/warm-cache');
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}