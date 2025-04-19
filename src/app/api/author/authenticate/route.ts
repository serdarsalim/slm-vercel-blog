import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return new Response('Author authentication API disabled - using direct Supabase authentication', { status: 404 });
}

// Keep OPTIONS for CORS compatibility
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