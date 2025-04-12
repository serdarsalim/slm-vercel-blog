// src/app/api/gas/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This endpoint is specifically optimized for Google Apps Script
export async function POST(request: NextRequest) {
  console.log("Google Apps Script specific auth endpoint called");
  
  // CORS headers - needed for Google Apps Script
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      // If JSON parsing fails, try to get the text and parse it again
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch (e2) {
        // If that fails too, check for query parameters
        const params = new URL(request.url).searchParams;
        body = {
          handle: params.get('handle'),
          authorToken: params.get('authorToken') || params.get('apiToken')
        };
      }
    }
    
    const { authorToken, apiToken, handle } = body;
    const token = authorToken || apiToken;
    
    console.log(`Processing auth for handle: ${handle}`);
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'API token is required'
      }, { status: 400, headers });
    }
    
    // Query Supabase
    const { data, error } = await supabase
      .from('authors')
      .select('handle, name, role')
      .eq('api_token', token)
      .single();
    
    if (error || !data) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials'
      }, { status: 401, headers });
    }
    
    // Return success
    return NextResponse.json({
      success: true,
      author: data
    }, { headers });
    
  } catch (e) {
    console.error("GAS Auth Error:", e);
    return NextResponse.json({
      success: false,
      error: 'Server error processing request'
    }, { status: 500, headers });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}

// Also handle GET requests
export async function GET(request: NextRequest) {
  console.log("GET request to GAS auth endpoint");
  
  // Get query parameters
  const params = new URL(request.url).searchParams;
  const handle = params.get('handle');
  const token = params.get('authorToken') || params.get('apiToken');
  
  if (!token) {
    return NextResponse.json({
      success: false,
      error: 'Token parameter required'
    }, { 
      status: 400, 
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // Build mock request
  const mockRequest = new Request(request.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      handle,
      authorToken: token
    })
  });
  
  // Process with our POST handler
  return POST(mockRequest as NextRequest);
}