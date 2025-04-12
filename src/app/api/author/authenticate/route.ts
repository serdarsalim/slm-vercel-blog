// src/app/api/author/authenticate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Use Node.js runtime for better stability with Google Apps Script
export const runtime = 'nodejs';

/**
 * Debug helper function that won't run in production
 */
function debugLog(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Auth Debug]', ...args);
  }
}

/**
 * Safely parse JSON with error handling
 */
async function safeParseBody(request: NextRequest) {
  try {
    // Check content type - Google Apps Script sometimes sends different content types
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Handle form data
      const formData = await request.formData();
      const obj: Record<string, any> = {};
      formData.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    } else {
      // Try to parse as JSON anyway
      const text = await request.text();
      try {
        return JSON.parse(text);
      } catch {
        // If that fails, see if it's URL encoded
        try {
          const params = new URLSearchParams(text);
          const obj: Record<string, any> = {};
          params.forEach((value, key) => {
            obj[key] = value;
          });
          return obj;
        } catch {
          throw new Error(`Unsupported content type: ${contentType}`);
        }
      }
    }
  } catch (e) {
    debugLog('Failed to parse request body:', e);
    throw e;
  }
}

/**
 * POST handler for authentication requests
 */
export async function POST(request: NextRequest) {
  const requestTime = new Date();
  const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  debugLog(`Auth request from ${clientIP} at ${requestTime.toISOString()}`);
  debugLog(`User agent: ${userAgent}`);
  
  // CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
  
  try {
    // Log all headers for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      debugLog('Request headers:');
      request.headers.forEach((value, key) => {
        debugLog(`  ${key}: ${value}`);
      });
    }
    
    // Parse request body with extra care for Google Apps Script
    let body;
    try {
      body = await safeParseBody(request);
      debugLog('Parsed body:', body);
    } catch (e) {
      debugLog('Body parse error:', e);
      return NextResponse.json({
        success: false,
        error: 'Invalid request format. Could not parse body.',
        details: process.env.NODE_ENV === 'development' ? String(e) : undefined
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Support multiple parameter formats for maximum compatibility
    const { 
      apiToken, api_token, authorToken, token, 
      handle, author, authorHandle, user 
    } = body;
    
    // Accept any of the token parameters
    const tokenToValidate = authorToken || apiToken || api_token || token;
    // Accept any of the handle parameters
    const handleToValidate = handle || author || authorHandle || user;
    
    debugLog('Token validation request:', { 
      tokenProvided: !!tokenToValidate,
      handleProvided: !!handleToValidate,
      paramNames: Object.keys(body)
    });
    
    // Input validation
    if (!tokenToValidate) {
      return NextResponse.json({ 
        success: false, 
        error: 'API token is required'
      }, { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Build Supabase query - start with token validation
    let query = supabase
      .from("authors")
      .select("handle, name, role")
      .eq("api_token", tokenToValidate);
    
    // If handle is provided, use it for additional validation
    if (handleToValidate) {
      query = query.eq("handle", handleToValidate);
    }
    
    // Execute the query
    const { data, error } = await query.single();
    
    // Handle errors or no results
    if (error) {
      debugLog('Supabase query error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { 
        status: 401,
        headers: corsHeaders
      });
    }
    
    if (!data) {
      debugLog('No matching author found');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials'
      }, { 
        status: 401,
        headers: corsHeaders
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
      headers: corsHeaders
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
      headers: corsHeaders
    });
  }
}

/**
 * Handle GET requests for Google Apps Script compatibility
 */
export async function GET(request: NextRequest) {
  // Some Google services fall back to GET with params in query string
  const params = request.nextUrl.searchParams;
  const token = params.get('authorToken') || params.get('apiToken') || params.get('token');
  const handle = params.get('handle') || params.get('author');
  
  if (token) {
    // Create a mock request with the right body
    const mockRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify({ authorToken: token, handle })
    });
    
    // Process it like a POST
    return POST(mockRequest as NextRequest);
  }
  
  // Not a valid auth request
  return NextResponse.json({
    success: false,
    error: 'For authentication, please use POST method or provide token in query params'
  }, { 
    status: 400,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    }
  });
}

/**
 * Handle OPTIONS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    }
  });
}