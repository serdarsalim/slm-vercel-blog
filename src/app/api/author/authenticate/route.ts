// app/api/author/authenticate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * OPTIONS handler for CORS support
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * POST handler for author authentication
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Author authentication endpoint called');
    const body = await request.json();
    
    // Log sanitized request details (no secrets)
    console.log('Request payload received:', {
      hasSecret: !!body.secret,
      hasAuthorToken: !!body.authorToken,
      handle: body.handle || 'not provided'
    });
    
    // 1. Validate server-side secret token
    const expectedSecret = process.env.VERCEL_API_TOKEN;
    if (!expectedSecret || body.secret !== expectedSecret) {
      console.error('Invalid or missing server secret token');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid server credentials' 
      }, { status: 401 });
    }
    
    // 2. Extract and validate author credentials
    const { authorToken, handle } = body;
    
    if (!authorToken || !handle) {
      return NextResponse.json({ 
        success: false, 
        error: 'Author token and handle are required' 
      }, { status: 400 });
    }
    
    // 3. Query Supabase for the author
    const { data, error } = await supabase
      .from('authors')
      .select('handle, name, role, api_token')
      .eq('handle', handle)
      .single();
    
    // 4. Handle database error
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Database error while validating credentials' 
      }, { status: 500 });
    }
    
    // 5. Check if author exists and token matches
    if (!data || data.api_token !== authorToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid author credentials' 
      }, { status: 401 });
    }
    
    // 6. Valid credentials - return success with author details
    return NextResponse.json({
      success: true,
      author: {
        handle: data.handle,
        name: data.name || data.handle,
        role: data.role || 'writer'
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
    
  } catch (error) {
    console.error('Author authentication error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown server error'
    }, { status: 500 });
  }
}