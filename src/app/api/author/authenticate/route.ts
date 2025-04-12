//app/api/author/authenticate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Force dynamic execution to prevent caching issues
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// CORS headers optimized for Google Apps Script compatibility
function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Content-Type': 'application/json'
  };
}

// Simple logging for debugging
function logAuthAttempt(handle: string, success: boolean, ip: string | null, error?: string) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: "author_auth_attempt",
    handle,
    success,
    ip,
    ...(error && { error })
  }));
}

// Main authentication handler
export async function POST(request: NextRequest) {
  // Get client IP for logging
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  console.log(`Authentication attempt from IP: ${ip}`);
  
  try {
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Body parse error:", e);
      logAuthAttempt('parse-error', false, ip, 'Invalid JSON payload');
      return NextResponse.json({ 
        success: false, 
        error: "Invalid request format" 
      }, { 
        status: 400,
        headers: getCorsHeaders() 
      });
    }
    
    // Support both parameter names for maximum compatibility
    const { handle, authorToken, api_token } = body;
    const token = authorToken || api_token;
    
    // Validate required fields
    if (!handle || !token) {
      logAuthAttempt(handle || 'unknown', false, ip, 'Missing credentials');
      return NextResponse.json({ 
        success: false, 
        error: "Handle and author token are required" 
      }, { 
        status: 400,
        headers: getCorsHeaders()
      });
    }
    
    console.log(`Auth attempt for handle: ${handle}`);
    
    // Verify credentials in Supabase
    const { data, error } = await supabase
      .from("authors")
      .select("handle, name, role")
      .eq("handle", handle)
      .eq("api_token", token)
      .single();
    
    if (error || !data) {
      logAuthAttempt(handle, false, ip, 'Invalid credentials');
      return NextResponse.json({ 
        success: false, 
        error: "Invalid credentials" 
      }, { 
        status: 401,
        headers: getCorsHeaders()
      });
    }
    
    // Authentication successful
    logAuthAttempt(handle, true, ip);
    return NextResponse.json({
      success: true,
      author: {
        handle: data.handle,
        name: data.name,
        role: data.role
      }
    }, {
      headers: getCorsHeaders()
    });
  } catch (error) {
    console.error("Auth error:", error);
    logAuthAttempt('error', false, ip, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Authentication failed" 
    }, { 
      status: 500,
      headers: getCorsHeaders()
    });
  }
}

// Handle OPTIONS requests (required for CORS)
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders()
  });
}

// Add a GET handler for connection testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Authentication endpoint ready",
    timestamp: new Date().toISOString()
  }, {
    headers: getCorsHeaders()
  });
}