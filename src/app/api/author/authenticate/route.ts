import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Get the secret token from env vars
    const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';
    
    const body = await request.json();
    
    // Validate request
    if (body.secret !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Extract author token to validate
    const { authorToken } = body;
    
    if (!authorToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Author token is required' 
      }, { status: 400 });
    }
    
    // Check if the token exists in the authors table
    const { data, error } = await supabase
      .from('authors')
      .select('handle, name, role')
      .eq('api_token', authorToken)
      .single();
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Database error: ${error.message}` 
      }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid author token' 
      }, { status: 401 });
    }
    
    return NextResponse.json({
      success: true,
      author: {
        handle: data.handle,
        name: data.name,
        role: data.role
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Author authentication error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

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