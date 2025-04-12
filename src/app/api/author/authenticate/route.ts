// src/app/api/author/authenticate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Use Node.js runtime for better stability with Supabase
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Add CORS headers for all responses (including errors)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  };

  try {
    // Safely parse the request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid request format' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Handle multiple token format options
    const token = body.authorToken || body.api_token || body.token;
    const { handle } = body;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'API token is required' },
        { status: 400, headers: corsHeaders }
      );
    }
    
    // Query Supabase to validate the token
    let query = supabase
      .from('authors')
      .select('handle, name, role')
      .eq('api_token', token);
    
    if (handle) {
      query = query.eq('handle', handle);
    }
    
    const { data, error } = await query.single();
    
    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401, headers: corsHeaders }
      );
    }
    
    // Success response
    return NextResponse.json(
      {
        success: true,
        author: {
          handle: data.handle,
          name: data.name,
          role: data.role
        },
        timestamp: new Date().toISOString()
      },
      { headers: corsHeaders }
    );
    
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Authentication service error',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle OPTIONS preflight request
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