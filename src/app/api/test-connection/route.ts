// src/app/api/test-connection/route.ts
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
    
    // Test Supabase connection using proper count method
    const { count, error } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json({ 
        success: false, 
        error: `Database connection error: ${error.message}` 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      postCount: count || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Test connection error:', error);
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