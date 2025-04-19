// src/app/api/reliable-warm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { forceISRRefresh } from '@/lib/cache-helpers';

// Keep track of recent warming operations for diagnostics
const recentOperations = [];

export async function GET(request: NextRequest) {
  // For diagnostics - return recent operations
  return NextResponse.json({
    recentOperations: recentOperations.slice(0, 10)
  });
}

export async function POST(request: NextRequest) {
  console.log('🔥 Starting reliable ISR warming');
  
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';
  
  try {
    const body = await request.json();
    
    // Validate token
    if (body.secret !== secretToken && body.token !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Get paths to warm
    const paths = body.paths || [];
    if (!Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No paths provided for warming' 
      }, { status: 400 });
    }
    
    // NEW: Filter out API routes that shouldn't be treated as content pages
    const filteredPaths = paths.filter(path => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      
      // Skip any path that starts with /api/
      if (normalizedPath.startsWith('/api/')) {
        console.log(`⚠️ Skipping API route: ${path}`);
        return false;
      }
      
      // Skip any path segments that might be mistaken for author/post combinations
      const segments = normalizedPath.split('/').filter(Boolean);
      if (segments[0] === 'api') {
        console.log(`⚠️ Skipping path with 'api' handle: ${path}`);
        return false;
      }
      
      return true;
    });
    
    console.log(`🔍 Filtered ${paths.length - filteredPaths.length} API routes from warming list`);
    
    // Create operation record
    const operationId = `warm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const operation = {
      id: operationId,
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      paths: filteredPaths.length, // Changed from paths.length to filteredPaths.length
      results: []
    };
    
    // Add to recent operations
    recentOperations.unshift(operation);
    if (recentOperations.length > 20) {
      recentOperations.pop();
    }
    
    console.log(`🚀 Warming operation ${operationId} with ${filteredPaths.length} paths`); // Changed from paths.length
    
    // Process paths in small batches to avoid overwhelming the server
    const batchSize = 2;
    const results = [];
    
    // Set a timeout to ensure this doesn't block too long
    // Define the possible return types
    type TimeoutResult = { timedOut: true };
    type CompletionResult = { completed: true; results: any[] };
    
    const timeoutPromise: Promise<TimeoutResult> = new Promise(resolve => {
      setTimeout(() => {
        resolve({ timedOut: true });
      }, 50000); // 50 second timeout
    });
    
    // Process all paths
    const warmingPromise: Promise<CompletionResult> = (async () => {
      for (let i = 0; i < filteredPaths.length; i += batchSize) { // Changed from paths.length
        const batch = filteredPaths.slice(i, i + batchSize); // Changed from paths.slice
        console.log(`⏳ Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(filteredPaths.length/batchSize)}`); // Changed from paths.length
        
        // Process each path in parallel
        const batchPromises = batch.map(async (path) => {
          // Convert path to full URL
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
          const fullUrl = path.startsWith('http') 
            ? path 
            : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
          
          // Parse path for author and post details
          const pathParts = path.split('/').filter(Boolean);
          const authorHandle = pathParts.length > 0 ? pathParts[0] : 'unknown';
          const postSlug = pathParts.length > 1 ? pathParts[1] : 'homepage';
          
          // Enhanced logging with author/tenant information
          console.log(`🔄 Warming: [${authorHandle}] ${path}${postSlug !== 'homepage' ? ` (post: ${postSlug})` : ''}`);
          
          // Step 1: Force ISR refresh
          const startTime = Date.now();

          try {
            const refreshed = await forceISRRefresh(fullUrl, 1);
            
            const result = {
              path,
              success: refreshed,
              timeMs: Date.now() - startTime,
              error: refreshed ? null : 'Failed to refresh content'
            };
            
            results.push(result);
            return result;
          } catch (error) {
            const result = {
              path,
              success: false,
              timeMs: Date.now() - startTime,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
            
            results.push(result);
            return result;
          }
        });
        
        // Wait for all paths in this batch
        await Promise.all(batchPromises);
        
        // Small pause between batches
        if (i + batchSize < filteredPaths.length) { // Changed from paths.length
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return { completed: true, results };
    })();
    
    // Wait for either completion or timeout
    const outcome = await Promise.race<TimeoutResult | CompletionResult>([warmingPromise, timeoutPromise]);
    
    // Update operation record
    if ('timedOut' in outcome) {
      operation.status = 'timeout';
      operation.results = results;
      
      return NextResponse.json({
        success: false,
        warmed: results.filter(r => r.success).length,
        total: filteredPaths.length, // Changed from paths.length
        completed: results.length,
        operationId,
        message: 'Operation timed out but partial results available',
        results
      });
    } else {
      // Success case
      const successful = results.filter(r => r.success).length;
      operation.status = 'completed';
      operation.results = results;
      
      return NextResponse.json({
        success: successful > 0,
        warmed: successful,
        total: filteredPaths.length, // Changed from paths.length
        operationId,
        results
      });
    }
  } catch (error) {
    console.error('❌ Error in reliable-warm:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}