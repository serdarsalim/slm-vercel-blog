// src/app/api/delete-image/route.ts

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

export async function POST(request: NextRequest) {
  console.log('Received POST request for image deletion');

  // Use your environment variable or a fallback for the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    // Authentication checks
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    if (bearerToken !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Parse the request body
    const body = await request.json();
    
    // Get the exact pathname from the request
    const pathname = body.pathname;
    
    if (!pathname) {
      console.log('No pathname provided');
      return NextResponse.json({ error: 'No pathname provided' }, { status: 400 });
    }
    
    console.log(`Attempting to delete blob with pathname: ${pathname}`);
    
    // Delete the blob using the exact pathname
    const result = await del(pathname);
    
    console.log(`Successfully deleted: ${pathname}`);
    
    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
      pathname: pathname
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
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