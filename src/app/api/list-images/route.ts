// src/app/api/list-images/route.ts

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: NextRequest) {
  console.log('Processing list images request');

  // Use your environment variable or a fallback for the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    // Check authorization with Bearer token
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    if (bearerToken !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Set the prefix to "images/" to only get files in that path
    const prefix = 'images/';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    
    // List blobs from Vercel Blob storage
    console.log(`Listing blobs with prefix: ${prefix}, limit: ${limit}`);
    
    const blobs = await list({
      prefix,
      limit
    });

    // Format and return the results without relying on contentType
    const images = blobs.blobs.map(blob => {
      // Extract file extension from pathname
      const extension = blob.pathname.split('.').pop()?.toLowerCase();
      
      // Guess content type based on file extension
      let contentType = 'application/octet-stream';
      if (['jpg', 'jpeg'].includes(extension)) contentType = 'image/jpeg';
      if (['png'].includes(extension)) contentType = 'image/png';
      if (['gif'].includes(extension)) contentType = 'image/gif';
      if (['webp'].includes(extension)) contentType = 'image/webp';
      if (['svg'].includes(extension)) contentType = 'image/svg+xml';
      
      return {
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        contentType: contentType
      };
    });
    
    return NextResponse.json({
      success: true,
      images: images
    });
  } catch (error) {
    console.error('Error listing images:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}