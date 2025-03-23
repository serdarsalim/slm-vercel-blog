// src/app/api/upload-image/route.ts

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: "This endpoint accepts POST requests for image uploads" },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    }
  );
}

export async function POST(request: NextRequest) {
  console.log('Processing image upload request');
  
  // Verify authorization
  const authHeader = request.headers.get('Authorization');
  const secretToken = process.env.UPLOAD_SECRET || 'your_default_secret';
  
  if (!authHeader || authHeader !== `Bearer ${secretToken}`) {
    console.log('Invalid or missing authorization');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // For multipart form data, we need to use formData()
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided or invalid file' }, { status: 400 });
    }

    // Get filename from form data or generate a random one
    const filename = formData.get('filename')?.toString() || 
                     `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Get the file extension from the content type
    const contentType = file.type;
    const fileExtension = contentType.split('/')[1] || 'png';
    
    // Construct the full filename with extension
    const fullFilename = filename.endsWith(`.${fileExtension}`) 
                         ? filename 
                         : `${filename}.${fileExtension}`;
    
    // Convert the file to a format Vercel Blob can handle
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Vercel Blob
    console.log(`Uploading file: ${fullFilename}, Content-Type: ${contentType}`);
    const blob = await put(fullFilename, buffer, {
      access: 'public',
      contentType: contentType,
      addRandomSuffix: true // Ensure uniqueness for image files
    });

    console.log('Upload successful, blob URL:', blob.url);
    
    // Return a clean URL (no query parameters)
    const cleanUrl = new URL(blob.url);
    cleanUrl.search = '';
    
    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      url: cleanUrl.toString(),
      originalUrl: blob.url
    });
  } catch (error) {
    console.error('Error processing image upload:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}