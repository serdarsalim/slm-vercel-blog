// app/api/reliable-warm/route.js
import { NextResponse } from 'next/server';

// Environment variable for your token (set this in Vercel)
const REVALIDATION_TOKEN = process.env.REVALIDATION_TOKEN;

export async function POST(request) {
  console.log('🔥 Cache warming request received');
  
  // Parse the incoming JSON request
  let payload;
  try {
    payload = await request.json();
    console.log(`📦 Payload received: ${payload.paths?.length} paths to warm`);
  } catch (error) {
    console.error('❌ Failed to parse request body:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid JSON payload' 
    }, { status: 400 });
  }

  // Verify the secret token
  const { token, paths, nocache } = payload;

  if (!token || token !== REVALIDATION_TOKEN) {
    console.error('🚫 Invalid warming token');
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid token' 
    }, { status: 401 });
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const warmedPaths = [];
    const failedPaths = [];
    
    console.log(`==== 🔥 CACHE WARMING STARTED ====`);
    console.log(`⏱️ Time: ${new Date().toISOString()}`);
    console.log(`🌐 Base URL: ${siteUrl}`);
    console.log(`🔄 No-cache: ${nocache === 'true' ? 'Enabled' : 'Disabled'}`);

    // Warm each path by fetching it
    if (Array.isArray(paths) && paths.length > 0) {
      // Use Promise.allSettled to process all paths in parallel
      const fetchPromises = paths.map(async (path) => {
        if (typeof path !== 'string') return { path: String(path), success: false, error: 'Invalid path' };
        
        // Construct the full URL
        const fullUrl = new URL(path, siteUrl).toString();
        console.log(`🔄 Warming: ${fullUrl}`);
        
        try {
          // Set up cache-busting headers if nocache is true
          const headers = {};
          if (nocache === 'true') {
            headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            headers['Pragma'] = 'no-cache';
          }
          
          // Fetch the URL
          const response = await fetch(fullUrl, { 
            method: 'GET',
            headers,
            cache: nocache === 'true' ? 'no-store' : 'default'
          });
          
          if (response.ok) {
            console.log(`✅ Warmed: ${path}`);
            warmedPaths.push(path);
            return { path, success: true };
          } else {
            console.error(`❌ Failed to warm ${path}: ${response.status} ${response.statusText}`);
            failedPaths.push(path);
            return { path, success: false, status: response.status };
          }
        } catch (error) {
          console.error(`❌ Error warming ${path}:`, error.message);
          failedPaths.push(path);
          return { path, success: false, error: error.message };
        }
      });
      
      // Wait for all fetches to complete
      const results = await Promise.allSettled(fetchPromises);
      
      // Summarize results
      const successResults = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failedResults = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;
      const errors = results.filter(r => r.status === 'rejected').length;
      
      console.log(`==== ✅ CACHE WARMING COMPLETE ====`);
      console.log(`✅ Successfully warmed: ${successResults}`);
      console.log(`❌ Failed to warm: ${failedResults}`);
      console.log(`❌ Errors: ${errors}`);
    } else {
      console.log(`⚠️ No paths provided for warming`);
    }

    // Return success response with details
    return NextResponse.json({
      success: true,
      warmed: warmedPaths.length,
      failed: failedPaths.length,
      warmedPaths,
      failedPaths
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Cache warming error:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Cache warming failed',
    }, { status: 500 });
  }
}