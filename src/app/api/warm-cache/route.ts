// src/app/api/warm-cache/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { filterWarmablePaths } from '@/lib/cache-helpers';

// We'll use this to track verified warmings
const verifiedWarmings = new Map();

export async function POST(request: NextRequest) {
  console.log('🔥 Starting reliable cache warming process');
  
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    
    if (body.secret !== secretToken && body.token !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if this is a verification request
    const verificationId = body.verificationId;
    if (verificationId && verifiedWarmings.has(verificationId)) {
      const result = verifiedWarmings.get(verificationId);
      verifiedWarmings.delete(verificationId); // Clean up
      return NextResponse.json(result);
    }
    
    const paths = body.paths || [];
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No paths provided for warming' 
      }, { status: 400 });
    }
    
    // Use our new utility to filter the paths
    const filteredPaths = filterWarmablePaths(paths);
    console.log(`🔍 Filtered ${paths.length - filteredPaths.length} API routes from warming list`);
    
    // Create unique operation ID
    const operationId = `warm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    console.log(`🔍 Warming operation ${operationId}: ${filteredPaths.length} paths`);
    
    // Record the start of warming in our diagnostic endpoint
    try {
      await fetch(`${request.nextUrl.origin}/api/warm-diagnostic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: secretToken,
          operationId,
          paths: filteredPaths  
        })
      });
    } catch (e) {
      console.log('❌ Diagnostic recording failed:', e);
      // Continue anyway - this is just for diagnostics
    }
    
    // Phase 1: Pause to ensure ISR has completed
    console.log('⏱️ Waiting for revalidation to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Phase 2: Warm the pages with proof of completion
    const results = [];
    let warmedCount = 0;
    
    // Only process 3 paths at a time to avoid overwhelming
    const batchSize = 3;
    
    for (let i = 0; i < filteredPaths.length; i += batchSize) {
      const batch = filteredPaths.slice(i, i + batchSize);
      console.log(`🌡️ Warming batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(filteredPaths.length/batchSize)}`);
      
      // Process each path in the batch
      const batchPromises = batch.map(async (path) => {
        const fullUrl = path.startsWith('http') 
          ? path 
          : `${request.nextUrl.origin}${path.startsWith('/') ? path : `/${path}`}`;
        
        const warmerTag = Date.now().toString();
        console.log(`🔄 Warming: ${fullUrl} with tag ${warmerTag}`);
        
        try {
          // First request - with cache buster to ensure fresh content
          const warmingUrl = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}cache_warmer=${warmerTag}`;
          
          const response = await fetch(warmingUrl, { 
            method: 'GET',
            cache: 'no-store',
            headers: { 
              'X-Cache-Warmer': operationId,
              'User-Agent': 'HALQA Cache Warmer 2.0',
              'Pragma': 'no-cache',
              'Cache-Control': 'no-cache'
            }
          });
          
          const status = response.status;
          const success = response.ok;
          const timeMs = 0; // We don't need exact timing
          
          if (success) {
            warmedCount++;
            // Fetch the HTML to verify
            const text = await response.text();
            const truncatedText = text.substring(0, 100); // Just for logging
            console.log(`✅ Successfully warmed ${path}: ${status}`);
            
            // Verify content has expected warmer tag (proving we got the right version)
            const contentHasTag = text.includes(warmerTag);
            
            return {
              path,
              success,
              status,
              contentVerified: contentHasTag,
              timeMs,
              contentSample: truncatedText
            };
          } else {
            console.log(`❌ Failed to warm ${path}: ${status}`);
            return { 
              path, 
              success: false, 
              status,
              error: `HTTP status ${status}`,
              timeMs
            };
          }
        } catch (error) {
          console.log(`❌ Error warming ${path}:`, error);
          return { 
            path, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      });
      
      // Wait for all paths in this batch
      results.push(...(await Promise.all(batchPromises)));
      
      // Small pause between batches
      if (i + batchSize < filteredPaths.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Final verification stats
    const verified = results.filter(r => r.success && r.contentVerified).length;
    const failed = filteredPaths.length - warmedCount;
    
    const finalResult = {
      success: warmedCount > 0,
      warmed: warmedCount,
      verified,
      failed,
      total: filteredPaths.length,
      operationId,
      results: results.map(r => ({
        path: r.path,
        success: r.success,
        status: r.status,
        verified: r.contentVerified || false,
        error: r.error || null
      }))
    };
    
    // Store result for verification
    verifiedWarmings.set(operationId, finalResult);
    
    // Allow 5 minutes for verification
    setTimeout(() => {
      if (verifiedWarmings.has(operationId)) {
        verifiedWarmings.delete(operationId);
      }
    }, 5 * 60 * 1000);
    
    console.log(`🏁 Warming complete: ${warmedCount}/${filteredPaths.length} warmed, ${verified} verified`);
    
    return NextResponse.json(finalResult, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('❌ Error processing warm-cache request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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