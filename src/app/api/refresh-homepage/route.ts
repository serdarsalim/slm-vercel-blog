// src/app/api/refresh-homepage/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { loadBlogPostsServer } from '@/lib/data';

export async function POST(request: NextRequest) {
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    
    if (body.secret !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    console.log('Refreshing homepage data...');
    
    // Step 1: Revalidate all relevant cache entries
    revalidateTag('posts');
    revalidatePath('/', 'page');
    revalidatePath('/blog', 'page');
    
    // Step 2: Explicitly load fresh data to warm the cache
    console.log('Warming homepage data cache...');
    const freshPosts = await loadBlogPostsServer();
    
    console.log(`Loaded ${freshPosts.length} posts for homepage`);
    
    // Step 3: Visit the homepage to ensure it's regenerated
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                     'https://slm-vercel-blog-git-main-serdar-salims-projects.vercel.app';
      
      // Add cache busting parameter
      const timestamp = Date.now();
      const homepageUrl = `${baseUrl}/?refresh=${timestamp}`;
      
      console.log(`Warming homepage: ${homepageUrl}`);
      
      const response = await fetch(homepageUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log(`Homepage warmed with status: ${response.status}`);
    } catch (warmError) {
      console.error('Error warming homepage:', warmError);
      // Continue despite warming error
    }
    
    return NextResponse.json({
      success: true,
      postCount: freshPosts.length,
      message: 'Homepage data refreshed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error refreshing homepage data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler for CORS like in your revalidate endpoint
export async function OPTIONS() {
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