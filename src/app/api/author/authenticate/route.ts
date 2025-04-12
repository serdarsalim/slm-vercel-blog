import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ensure route is always dynamic and doesn't get cached
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'; // More reliable than edge for auth

// Debug helper function that doesn't log in production
function debugLog(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth Debug]', ...args);
  }
}

export async function POST(request: NextRequest) {
  const requestTime = new Date();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  debugLog(`Auth request from ${clientIP} at ${requestTime.toISOString()}`);
  
  try {
    // Parse request body with better error handling
    let body;
    try {
      body = await request.json();
      debugLog('Request body:', body);
    } catch (e) {
      debugLog('Failed to parse JSON:', e);
      return NextResponse.json({
        success: false,
        error: 'Invalid request format. JSON body required.'
      }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Support multiple parameter formats for maximum compatibility
    const { apiToken, api_token, authorToken, token, handle } = body;
    
    // Accept any of the token parameters
    const tokenToValidate = apiToken || authorToken || api_token || token;
    
    debugLog('Token validation request:', { 
      tokenProvided: !!tokenToValidate,
      handleProvided: !!handle,
      paramNames: Object.keys(body)
    });
    
    // Input validation
    if (!tokenToValidate) {
      return NextResponse.json({ 
        success: false, 
        error: 'API token is required'
      }, { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Build query - start with token validation
    let query = supabase
      .from("authors")
      .select("handle, name, role")
      .eq("api_token", tokenToValidate);
    
    // If handle is provided, use it for additional validation
    if (handle) {
      query = query.eq("handle", handle);
    }
    
    // Execute the query
    const { data, error } = await query.single();
    
    if (error) {
      debugLog('Supabase query error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { 
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    if (!data) {
      debugLog('No matching author found');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials'
      }, { 
        status: 401,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Authentication successful
    debugLog('Authentication successful for', data.handle);
    return NextResponse.json({
      success: true,
      author: {
        handle: data.handle,
        name: data.name,
        role: data.role
      },
      timestamp: requestTime.toISOString()
    }, {
      headers: {
        // Comprehensive CORS and cache headers
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    debugLog('Unhandled error:', error);
    return NextResponse.json({
      success: false,
      error: 'Authentication service error',
      message: error instanceof Error ? error.message : String(error),
      debug: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}

// Handle OPTIONS preflight requests with comprehensive CORS support
export async function OPTIONS(request: NextRequest) {
  debugLog('OPTIONS request received');
  
  // Get origin or default to '*'
  const origin = request.headers.get('origin') || '*';
  
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    }
  });
}