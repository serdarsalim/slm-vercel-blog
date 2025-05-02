// app/api/reliable-warm/route.js
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('==== 🔥 CACHE WARMING REQUEST RECEIVED ====');
  console.log(`⏱️ Timestamp: ${new Date().toISOString()}`);
  
  // Parse the incoming JSON request
  let payload;
  try {
    payload = await request.json();
    console.log(`📦 PAYLOAD SUMMARY: ${payload.paths?.length || 0} paths to warm`);
    
    // Log author info if present
    if (payload.authorHandle) {
      console.log(`👤 AUTHOR: ${payload.authorHandle}`);
    }
  } catch (error) {
    console.error('❌ Failed to parse request body:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid JSON payload' 
    }, { status: 400 });
  }

  // Verify the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';
  if (payload.token !== secretToken) {
    console.error('🚫 Invalid warming token');
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid token' 
    }, { status: 401 });
  }

  try {
    const { paths, nocache, authorHandle, operation } = payload;
    const siteUrl = 'https://halqa.xyz';
    
    // Log operation details
    if (operation) {
      console.log(`🔄 OPERATION TYPE: ${operation}`);
    }
    
    console.log(`==== 🔥 WARMING PATHS ====`);
    console.log(`🌐 Base URL: ${siteUrl}`);
    console.log(`🔄 No-cache: ${nocache === 'true' ? 'Enabled' : 'Disabled'}`);
    
    const warmedPaths = [];
    const failedPaths = [];

    // Warm each path by fetching it
    if (Array.isArray(paths) && paths.length > 0) {
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        if (typeof path !== 'string') continue;
        
        const fullUrl = new URL(path, siteUrl).toString();
        console.log(`  ${i + 1}. 🔄 Warming: ${fullUrl}`);
        
        try {
          const headers = {};
          if (nocache === 'true') {
            headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            headers['Pragma'] = 'no-cache';
          }
          
          const response = await fetch(fullUrl, { 
            method: 'GET',
            headers,
            cache: nocache === 'true' ? 'no-store' : 'default'
          });
          
          if (response.ok) {
            console.log(`    ✅ Successfully warmed: ${path}`);
            warmedPaths.push(path);
          } else {
            console.error(`    ❌ Failed to warm ${path}: ${response.status} ${response.statusText}`);
            failedPaths.push(path);
          }
        } catch (error) {
          console.error(`    ❌ Error warming ${path}: ${error.message}`);
          failedPaths.push(path);
        }
      }
    } else {
      console.log(`⚠️ NO PATHS PROVIDED FOR WARMING`);
    }
    
    // Summary log
    console.log(`==== ✅ CACHE WARMING COMPLETE ====`);
    console.log(`👤 Author: ${authorHandle || 'None provided'}`);
    console.log(`🔄 Operation: ${operation || 'Not specified'}`);
    console.log(`✅ Successfully warmed: ${warmedPaths.length}`);
    console.log(`❌ Failed to warm: ${failedPaths.length}`);
    console.log(`⏱️ Completed: ${new Date().toISOString()}`);
    console.log(`=======================================`);

    // Return success response with details
    return NextResponse.json({
      success: true,
      warmed: warmedPaths.length,
      failed: failedPaths.length,
      authorHandle,
      operation,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('❌ CACHE WARMING ERROR:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}