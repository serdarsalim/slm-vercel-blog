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
      handle, author, authorHandle, user,
      secret, vercelToken // Added Vercel token support
    } = body;
    
    // Check for Vercel authentication first (higher priority)
    const vercelSecret = secret || vercelToken;
    const expectedSecret = process.env.VERCEL_API_SECRET || process.env.API_SECRET_TOKEN;
    
    // If Vercel secret is provided and matches expected value
    if (vercelSecret && expectedSecret && vercelSecret === expectedSecret) {
      debugLog('Vercel API token authentication successful');
      return NextResponse.json({
        success: true,
        authMethod: 'vercel',
        author: {
          handle: 'admin',
          name: 'System Admin',
          role: 'admin'
        },
        timestamp: requestTime.toISOString()
      }, {
        headers: corsHeaders
      });
    }
    
    // Fall back to author token authentication
    const tokenToValidate = authorToken || apiToken || api_token || token;
    const handleToValidate = handle || author || authorHandle || user;
    
    debugLog('Author token validation request:', { 
      tokenProvided: !!tokenToValidate,
      handleProvided: !!handleToValidate,
      paramNames: Object.keys(body)
    });
    
    // Input validation
    if (!tokenToValidate) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication token is required'
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
    debugLog('Author API token authentication successful for', data.handle);
    return NextResponse.json({
      success: true,
      authMethod: 'author',
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
  debugLog("GET request received, likely from Google Apps Script");
  
  // Extract query parameters
  const searchParams = request.nextUrl.searchParams;
  const authorToken = searchParams.get('authorToken') || searchParams.get('apiToken');
  const handle = searchParams.get('handle');
  const secret = searchParams.get('secret') || searchParams.get('vercelToken');
  
  // Log the parameters with safe truncation for tokens
  debugLog(`Params: token=${authorToken ? authorToken.substring(0,5) + '...' : 'none'}, handle=${handle || 'none'}, secret=${secret ? 'provided' : 'none'}`);
  
  // Check for Vercel authentication first
  if (secret) {
    const expectedSecret = process.env.VERCEL_API_SECRET || process.env.API_SECRET_TOKEN;
    if (expectedSecret && secret === expectedSecret) {
      debugLog('Vercel API token GET authentication successful');
      return NextResponse.json({
        success: true,
        authMethod: 'vercel',
        author: {
          handle: 'admin',
          name: 'System Admin',
          role: 'admin'
        },
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        }
      });
    }
  }
  
  // If we have an authorToken, treat this as an author auth request
  if (authorToken) {
    // Create a mock POST request to reuse our existing logic
    const mockBody = JSON.stringify({ authorToken, handle });
    const mockRequest = new Request(request.url, {
      method: 'POST',
      headers: new Headers({
        'Content-Type': 'application/json'
      }),
      body: mockBody
    });
    
    // Process it with our POST handler
    return POST(mockRequest as NextRequest);
  }
  
  // Otherwise return a helpful message
  return NextResponse.json({
    success: false,
    error: 'For authentication, please provide authorToken/handle or secret parameter',
    supportedMethods: ['POST', 'GET with params']
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