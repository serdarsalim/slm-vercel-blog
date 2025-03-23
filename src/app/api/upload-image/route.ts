// src/app/api/upload-image/route.ts

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// Generate a unique filename without external dependencies
function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const randomChars = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomChars}`;
}

export async function OPTIONS(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: "This endpoint accepts POST requests for image uploads." },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    }
  );
}

export async function POST(request: NextRequest) {
  const secretToken = process.env.UPLOAD_SECRET || 'your_default_secret';

  try {
    // Verify the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== secretToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse formData and get the file
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }
    const fileType = file.type;
    if (!fileType.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    const fileExt = fileType.split('/')[1] || 'png';
    const fileName = `${generateUniqueId()}.${fileExt}`;

    // Convert the file to a Buffer (Node.js expects a Buffer for binary data)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Vercel Blob storage
    const blob = await put(fileName, buffer, {
      access: 'public',
      contentType: fileType,
      addRandomSuffix: false
    });

    // Clean the URL (remove query parameters, if any)
    const cleanUrl = new URL(blob.url);
    cleanUrl.search = '';

    return NextResponse.json(
      {
        success: true,
        url: cleanUrl.toString(),
        size: file.size,
        type: fileType
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}