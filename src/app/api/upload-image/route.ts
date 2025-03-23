// src/app/api/upload-csv/route.ts

// Set the runtime to Node.js for blob operations and force dynamic routing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

// GET handler – for testing and basic info
export async function GET(request: NextRequest) {
  console.log('GET request to /api/upload-csv');
  return NextResponse.json(
    { message: "This endpoint accepts POST requests for CSV uploads" },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    }
  );
}

// POST handler – receives CSV data, saves it to Vercel Blob, and returns the file URL
export async function POST(request: NextRequest) {
  console.log('POST request to /api/upload-csv');

  // Use your environment variable or a fallback for the secret token
  const secretToken = process.env.UPLOAD_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    console.log('Received request body:', body);

    // Validate the secret token
    if (body.secret !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Ensure CSV content is provided
    if (!body.csvContent) {
      console.log('No CSV content provided');
      return NextResponse.json({ error: 'No CSV content provided' }, { status: 400 });
    }

    // Define a fixed filename for the CSV
    const filename = 'blogPosts.csv';
    
    console.log('Uploading CSV to Vercel Blob...');
    // Upload the CSV to Blob storage
    const blob = await put(filename, body.csvContent, {
      access: 'public',
      contentType: 'text/csv',
      addRandomSuffix: false // Ensure a consistent filename (overwriting the previous file)
    });
    
    console.log('CSV uploaded successfully, blob URL:', blob.url);
    
    // Clean the URL (remove any query parameters)
    const cleanUrl = new URL(blob.url);
    cleanUrl.search = '';
    console.log('Clean persistent URL:', cleanUrl.toString());

    // Return a success response with the URL
    return NextResponse.json(
      {
        success: true,
        message: 'CSV uploaded successfully',
        url: cleanUrl.toString(),
        originalUrl: blob.url // Original URL included for debugging if needed
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  console.log('OPTIONS request to /api/upload-csv');
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