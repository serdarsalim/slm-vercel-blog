// src/app/api/warm-cache/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('POST request to /api/warm-cache');
  
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    
    // Validate the secret token
    if (body.secret !== secretToken && body.token !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the base URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://slm-vercel-blog-git-main-serdar-salims-projects.vercel.app';
    
    // Get the paths to warm
    const paths = body.paths || [];
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No paths provided for warming' 
      }, { status: 400 });
    }
    
    console.log(`Starting cache warming for ${paths.length} paths...`);
    
    // Process each URL sequentially to avoid overwhelming the server
    const results = [];
    let warmedCount = 0;
    
    for (const path of paths) {
      try {
        const fullUrl = path.startsWith('http') ? path : `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
        console.log(`Warming: ${fullUrl}`);
        
        const start = Date.now();
        const response = await fetch(fullUrl, { 
          method: 'GET',
          cache: 'no-store', // Force fresh fetch
          headers: { 
            'X-Cache-Warmer': 'true',
            'User-Agent': 'WriteAway Cache Warmer Bot'
          }
        });
        
        const timeMs = Date.now() - start;
        const success = response.ok;
        
        if (success) warmedCount++;
        
        results.push({
          path,
          url: fullUrl,
          status: response.status,
          success,
          timeMs
        });
        
        console.log(`Warmed ${path}: ${response.status} in ${timeMs}ms`);
        
        // Small delay between requests to be gentle on the server
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        console.error(`Error warming ${path}:`, error);
        results.push({ 
          path, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return NextResponse.json({
      success: warmedCount > 0,
      warmed: warmedCount,
      failed: paths.length - warmedCount,
      total: paths.length,
      results
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