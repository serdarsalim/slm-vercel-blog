import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Add this to ensure Next.js properly handles this as a dynamic route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Log authentication attempts (for security monitoring)
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

// Rate limiting simple implementation
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 attempts per minute per IP
const ipAttempts = new Map<string, {count: number, timestamp: number}>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = ipAttempts.get(ip);
  
  // Clean up old records
  if (record && now - record.timestamp > RATE_LIMIT_WINDOW) {
    ipAttempts.delete(ip);
    return true;
  }
  
  if (!record) {
    ipAttempts.set(ip, { count: 1, timestamp: now });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  // Get client IP for rate limiting and logging
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  console.log(`Authentication attempt from IP: ${ip}`);
  
  // Check rate limit
  if (!checkRateLimit(ip as string)) {
    logAuthAttempt('rate-limited', false, ip, 'Rate limit exceeded');
    return NextResponse.json({ 
      success: false, 
      error: "Too many attempts. Please try again later."
    }, { status: 429 });
  }
  
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      logAuthAttempt('parse-error', false, ip, 'Invalid JSON payload');
      return NextResponse.json({ 
        success: false, 
        error: "Invalid request format" 
      }, { status: 400 });
    }
    
    // Accept both authorToken and api_token parameters for flexibility
    const { handle, authorToken, api_token } = body;
    const tokenToCheck = authorToken || api_token;
    
    // Validate required fields
    if (!handle || !tokenToCheck) {
      logAuthAttempt(handle || 'unknown', false, ip, 'Missing credentials');
      return NextResponse.json({ 
        success: false, 
        error: "Handle and token are required" 
      }, { status: 400 });
    }
    
    console.log(`Token validation for handle: ${handle}`);
    
    // Check if token exists in database
    const { data, error } = await supabase
      .from("authors")
      .select("handle, name, role")
      .eq("handle", handle)
      .eq("api_token", tokenToCheck)
      .single();
    
    if (error || !data) {
      logAuthAttempt(handle, false, ip, 'Invalid credentials');
      return NextResponse.json({ 
        success: false, 
        error: "Invalid credentials" 
      }, { status: 401 });
    }
    
    // Token validation successful
    logAuthAttempt(handle, true, ip);
    return NextResponse.json({
      success: true,
      author: {
        handle: data.handle,
        name: data.name,
        role: data.role || 'author'
      }
    }, {
      headers: {
        // Cache control headers + CORS for CMS compatibility
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      }
    });
  } catch (error) {
    console.error("Token validation error:", error);
    logAuthAttempt('error', false, ip, error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Token validation failed" 
    }, { status: 500 });
  }
}

// Handle OPTIONS preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400'
    }
  });
}