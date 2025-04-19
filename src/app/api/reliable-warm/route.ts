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
    
    // Create operation record
    const operationId = `warm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const operation = {
      id: operationId,
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      paths: paths.length,
      results: []
    };
    
    // Add to recent operations
    recentOperations.unshift(operation);
    if (recentOperations.length > 20) {
      recentOperations.pop();
    }
    
    console.log(`🚀 Warming operation ${operationId} with ${paths.length} paths`);
    
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
      for (let i = 0; i < paths.length; i += batchSize) {
        const batch = paths.slice(i, i + batchSize);
        console.log(`⏳ Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(paths.length/batchSize)}`);
        
        // Process each path in parallel
        const batchPromises = batch.map(async (path) => {
          // Convert path to full URL
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
          const fullUrl = path.startsWith('http') 
            ? path 
            : `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
          
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
        if (i + batchSize < paths.length) {
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
        total: paths.length,
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
        total: paths.length,
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