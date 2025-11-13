// src/app/api/upload-image/route.ts

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { put, list } from '@vercel/blob';
import { getRequiredEnvVar } from '@/lib/env';

const secretToken = getRequiredEnvVar('REVALIDATION_SECRET');

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

  try {
    // Get the form data
    const formData = await request.formData();
    
    // Support BOTH authentication methods:
    // 1. Secret in form data (like your CSV route)
    // 2. Bearer token in Authorization header (like your Google Apps Script)
    const formSecret = formData.get('secret')?.toString();
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    // Check if either authentication method is valid
    if (formSecret !== secretToken && bearerToken !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Get the file - check BOTH field names: 'file' (your API) and 'image' (Google Script)
    const file = formData.get('file') || formData.get('image');
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No image provided or invalid file' }, { status: 400 });
    }

    // Get filename or generate one
    let filename = formData.get('filename')?.toString() || 
                   `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    // Ensure filename has images/ prefix
    if (!filename.startsWith('images/')) {
      filename = `images/${filename}`;
    }
    
    // Get the file extension from the content type
    const contentType = file.type;
    let fileExtension = '';
    
    // Map content types to appropriate extensions
    if (contentType === 'image/jpeg' || contentType === 'image/jpg') {
      fileExtension = '.jpg';
    } else if (contentType === 'image/png') {
      fileExtension = '.png';
    } else if (contentType === 'image/gif') {
      fileExtension = '.gif';
    } else if (contentType === 'image/webp') {
      fileExtension = '.webp';
    } else if (contentType === 'image/svg+xml') {
      fileExtension = '.svg';
    } else {
      fileExtension = `.${contentType.split('/')[1] || 'bin'}`;
    }
    
    // Check if the filename already has a valid extension
    const hasValidExtension = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
    
    // Construct the full filename with extension
    const fullFilename = hasValidExtension 
                         ? filename 
                         : `${filename}${fileExtension}`;
    
    // NEW: Check if file with same name already exists
    console.log(`Checking if file exists: ${fullFilename}`);
    const existingBlobs = await list({
      prefix: fullFilename,
      limit: 1
    });
    
    if (existingBlobs.blobs.some(blob => blob.pathname === fullFilename)) {
      console.log(`File already exists: ${fullFilename}`);
      return NextResponse.json({
        success: false,
        error: 'A file with this name already exists',
        message: 'Please upload with a different filename to avoid overwriting existing files',
        existingFile: fullFilename
      }, { status: 409 }); // 409 Conflict
    }
    
    // Convert the file to a format Vercel Blob can handle
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Vercel Blob WITHOUT random suffix
    console.log(`Uploading file: ${fullFilename}, Content-Type: ${contentType}`);
    const blob = await put(fullFilename, buffer, {
      access: 'public',
      contentType: contentType,
      addRandomSuffix: false  // No random suffix
    });

    console.log('Upload successful, blob URL:', blob.url);
    console.log('Exact pathname:', blob.pathname);
    
    // Return a clean URL (no query parameters)
    const cleanUrl = new URL(blob.url);
    cleanUrl.search = '';
    
    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      url: cleanUrl.toString(),
      originalUrl: blob.url,
      pathname: blob.pathname  // Include exact pathname for reference
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
