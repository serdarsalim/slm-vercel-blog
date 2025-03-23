// src/app/api/upload-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Set the runtime to Node.js for blob operations and force dynamic
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Generate a unique filename without external dependencies
function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const randomChars = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomChars}`;
}

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight request
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

export async function POST(request: NextRequest) {
  try {
    // Check if the request contains the secret token
    const authHeader = request.headers.get('Authorization');
    
    // IMPORTANT: Make sure UPLOAD_SECRET is set in your environment variables
    const secret = process.env.UPLOAD_SECRET;
    
    // Verify auth token
    if (!secret || !authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== secret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    
    // Validate the file
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Check file type
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExt = fileType.split('/')[1] || 'png';
    
    // Generate a unique filename
    const fileName = `${generateUniqueId()}.${fileExt}`;
    
    // Upload to Vercel Blob storage
    const blob = await put(fileName, file, {
      access: 'public',
      contentType: fileType,
      addRandomSuffix: false // Use our own ID for predictable URLs
    });

    // Return success with the URL
    return NextResponse.json({
      success: true,
      url: blob.url,
      size: file.size,
      type: fileType
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET method for testing if the endpoint is working
export async function GET() {
  return NextResponse.json({
    message: 'Image upload API is working. Use POST to upload images.'
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  });
}