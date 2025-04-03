// src/app/api/revalidate/route.ts

// Set the runtime to Node.js for blob operations and force dynamic routing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { revalidatePath, revalidateTag } from 'next/cache';


// GET handler – for testing and basic info
export async function GET(request: NextRequest) {
  console.log('GET request to /api/revalidate');
  return NextResponse.json(
    { message: "This endpoint accepts POST requests for blog updates" },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      }
    }
  );
}

// POST handler – receives CSV data, saves it, and triggers revalidation
export async function POST(request: NextRequest) {
  console.log('POST request to /api/revalidate');

  // Use your environment variable or a fallback for the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    console.log('Received request body:', body);

    // Validate the secret token
    if (body.secret !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Test mode check - keep this unchanged
    if (body.test === true || body.test === 'true') {
      console.log('API key test successful');
      return NextResponse.json({ 
        success: true, 
        message: 'API key is valid' 
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Ensure CSV content is provided
    if (!body.csvContent) {
      console.log('No CSV content provided');
      return NextResponse.json({ error: 'No CSV content provided' }, { status: 400 });
    }

    // NEW: Determine filename based on sheetType
    let filename = 'blogPosts.csv'; // Default to blog posts
    
    if (body.sheetType === 'settings') {
      filename = 'settings.csv';
      console.log('Processing settings data...');
    } else {
      console.log('Processing blog posts data...');
    }

    // Upload the CSV to Vercel Blob storage with consistent path and filename
    console.log(`Uploading ${filename} to Vercel Blob...`);
    
    // Rest of the code remains the same
    const blob = await (async () => {
      try {
        const result = await put(filename, body.csvContent, {
          access: 'public',
          contentType: 'text/csv',
          addRandomSuffix: false
        });
        
        console.log('CSV uploaded successfully, blob URL:', result.url);
        
        // Store the URL without any cache-busting parameters
        const cleanUrl = new URL(result.url);
        cleanUrl.search = ''; // Remove any query parameters
        console.log('Clean persistent URL:', cleanUrl.toString());
        
        // Verify the upload by checking if the URL contains the expected filename
        if (!result.url.includes(filename)) {
          console.warn(`Warning: Blob URL doesn't contain expected filename '${filename}'. URL: ${result.url}`);
        }
        
        return result;
      } catch (error) {
        console.error('Error uploading to Vercel Blob:', error);
        throw new Error(`Failed to upload to Vercel Blob: ${error.message}`);
      }
    })();

    // Revalidate cache tags
console.log('Revalidating cache tags');
revalidateTag('posts');
if (body.sheetType === 'settings') {
  revalidateTag('settings');
}


    // Revalidate the specific path, if provided
    if (body.path) {
      console.log(`Revalidating path: ${body.path}`);
      revalidatePath(body.path);
    }
    // Always revalidate the homepage
    console.log('Revalidating homepage');
    revalidatePath('/');

    // Return a success response with the clean URL
    const cleanUrl = new URL(blob.url);
    cleanUrl.search = ''; // Remove any query parameters
    
    return NextResponse.json(
      {
        success: true,
        message: 'Blog updated and pages revalidated',
        url: cleanUrl.toString(),
        originalUrl: blob.url // Include original URL for debugging if needed
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
      { error: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS() {
  console.log('OPTIONS request to /api/revalidate');
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