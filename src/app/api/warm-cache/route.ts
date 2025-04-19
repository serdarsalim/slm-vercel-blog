// Updated warm-cache/route.ts with retry and prioritization
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('POST request to /api/warm-cache');
  
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    console.log('Received warming request:', JSON.stringify(body).substring(0, 200));

    // Validate the secret token
    if (body.secret !== secretToken && body.token !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Extract parameters
    const paths = body.paths || [];
    const origin = body.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://your-site.com';
    const maxRetries = body.maxRetries || 2; // New parameter for retries
    const concurrentBatch = body.concurrent || 5; // New parameter for concurrent requests
    
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No paths provided for warming' 
      }, { status: 400 });
    }
    
    console.log(`Starting cache warming for ${paths.length} paths...`);
    
    // Prioritize paths (home, author pages first, then content pages)
    const prioritizedPaths = [...paths].sort((a, b) => {
      // Home page gets highest priority
      if (a === '/' || a === '/index') return -1;
      if (b === '/' || b === '/index') return 1;
      
      // Author pages get next priority
      const aIsAuthorPage = a.split('/').length === 2;
      const bIsAuthorPage = b.split('/').length === 2;
      if (aIsAuthorPage && !bIsAuthorPage) return -1;
      if (bIsAuthorPage && !aIsAuthorPage) return 1;
      
      return 0;
    });
    
    // Process in concurrent batches with retries
    const results = [];
    let warmedCount = 0;
    
    // Process paths in batches with Promise.all for concurrency
    for (let i = 0; i < prioritizedPaths.length; i += concurrentBatch) {
      const batch = prioritizedPaths.slice(i, i + concurrentBatch);
      console.log(`Warming batch ${Math.floor(i / concurrentBatch) + 1} of ${Math.ceil(prioritizedPaths.length / concurrentBatch)}`);
      
      const batchResults = await Promise.all(
        batch.map(async (path) => {
          // Implement retry logic
          let attempts = 0;
          let success = false;
          let error = null;
          let status = 0;
          let timeMs = 0;
          
          while (attempts <= maxRetries && !success) {
            attempts++;
            try {
              const fullUrl = path.startsWith('http') ? path : `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
              console.log(`Warming: ${fullUrl} (attempt ${attempts})`);
              
              const start = Date.now();
              const response = await fetch(fullUrl, { 
                method: 'GET',
                cache: 'no-store',
                headers: { 
                  'X-Cache-Warmer': 'true',
                  'User-Agent': 'WriteAway Cache Warmer Bot',
                  'Cache-Control': 'no-cache'
                }
              });
              
              timeMs = Date.now() - start;
              status = response.status;
              success = response.ok;
              
              if (!success) {
                throw new Error(`HTTP status ${status}`);
              }
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error';
              console.log(`Error warming ${path} (attempt ${attempts}): ${error}`);
              // Wait briefly before retry
              if (attempts <= maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 500 * attempts));
              }
            }
          }
          
          if (success) warmedCount++;
          
          return { 
            path, 
            success, 
            attempts,
            status,
            timeMs,
            error: success ? null : error
          };
        })
      );
      
      results.push(...batchResults);
      
      // Add a small delay between batches to avoid overwhelming the server
      if (i + concurrentBatch < prioritizedPaths.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    return NextResponse.json({
      success: warmedCount > 0,
      warmed: warmedCount,
      failed: prioritizedPaths.length - warmedCount,
      total: prioritizedPaths.length,
      results
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error processing warm-cache request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}