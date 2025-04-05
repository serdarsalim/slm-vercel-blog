// src/app/api/revalidate/route.ts

// Set the runtime to Node.js for blob operations and force dynamic routing
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { revalidatePath, revalidateTag } from 'next/cache';


// GET handler – for testing and basic info
export async function GET(request: NextRequest) {
  console.log('GET request to /api/revalidate');
  
  // Use your environment variable or a fallback for the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';
  
  // Get the token from the request
  const token = request.nextUrl.searchParams.get('token');
  
  // Validate the token
  if (token !== secretToken) {
    console.log('Invalid revalidation token');
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  try {
    // Get the path to revalidate (default to blog)
    const path = request.nextUrl.searchParams.get('path') || '/blog';
    
    // Log the revalidation attempt
    console.log(`Revalidating: ${path}`);
    
    // Revalidate both the tag and the path for complete coverage
    revalidateTag('posts');
    revalidatePath(path);
    
    // For thoroughness, also revalidate the home page and individual post pattern
    revalidatePath('/');
    revalidatePath('/blog/[slug]', 'page');
    
    return NextResponse.json({
      revalidated: true,
      message: `Revalidated ${path} and related paths`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json({
      revalidated: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
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
    if (body.secret !== secretToken && body.token !== secretToken) {
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

    // Handle two cases:
    // 1. Google Apps Script sending a simple revalidation trigger
    if (body.action === 'revalidate' || !body.csvContent) {
      // Simple revalidation without updating the blob
      console.log('Running cache revalidation (no content update)');
      
      // Get the path to revalidate
      const path = body.path || '/blog';
      
      // Revalidate cache tags and paths
      revalidateTag('posts');
      revalidatePath(path);
      revalidatePath('/');
      revalidatePath('/blog/[slug]', 'page');
      
      return NextResponse.json({
        success: true,
        message: 'Blog pages revalidated',
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 2. CSV content upload and revalidation
    
    // Ensure CSV content is provided
    if (!body.csvContent) {
      console.log('No CSV content provided');
      return NextResponse.json({ error: 'No CSV content provided' }, { status: 400 });
    }

    // NEW: Determine filename based on sheetType
    let filename = 'blogPosts.csv'; // Default to blog posts
    
    if (body.sheetType === 'preferences') {
      filename = 'preferences.csv';
      console.log('Processing preferences data...');
    } else {
      console.log('Processing blog posts data...');
    }

    // Try to delete existing file before upload
    try {
      console.log(`Attempting to delete existing ${filename} before upload...`);
      await del(filename);
      console.log(`Successfully deleted existing ${filename}`);
    } catch (deleteError) {
      console.warn(`Warning when deleting ${filename}:`, deleteError);
      // Continue with upload even if delete fails
    }

    // Add a tiny delay after deletion
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Handle preferences specifically
    if (body.sheetType === 'preferences') {
      // For preferences specifically, add a unique suffix to the content
      const timestamp = new Date().toISOString();
      const uniqueMarker = `\n<!-- Generated: ${timestamp} -->\n`;
      
      // Append the marker to the CSV content (it will be ignored when parsing CSV)
      body.csvContent = body.csvContent + uniqueMarker;
    }

    // Upload to Vercel Blob
    const blob = await put(filename, body.csvContent, {
      access: 'public',
      contentType: 'text/csv',
      addRandomSuffix: false
    });
    
    console.log('CSV uploaded successfully, blob URL:', blob.url);
    
    // Store the URL without any cache-busting parameters
    const cleanUrl = new URL(blob.url);
    cleanUrl.search = ''; // Remove any query parameters
    console.log('Clean persistent URL:', cleanUrl.toString());

    // Revalidate cache tags
    console.log('Running enhanced cache revalidation...');

    // Basic tag revalidation first
    revalidateTag('posts');
    if (body.sheetType === 'preferences') {
      revalidateTag('preferences');
    }
    
    // For blog posts, use comprehensive revalidation strategy
    if (body.sheetType !== 'preferences') {
      // Wait a moment for blog content to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Revalidate multiple ways for key pages
      console.log('Revalidating blog index pages');
      revalidatePath('/', 'page');
      revalidatePath('/blog', 'page');
      revalidatePath('/', 'layout');
      revalidatePath('/blog', 'layout');
      
      // If we have slug info, revalidate that specific post too
      if (body.slug) {
        console.log(`Revalidating specific post: ${body.slug}`);
        revalidatePath(`/blog/${body.slug}`, 'page');
        revalidatePath(`/blog/${body.slug}`, 'layout');
      }
      
      // Generic path for all blog posts
      revalidatePath('/blog/[slug]', 'page');
    }
    
    // Revalidate the specific path, if provided
    if (body.path) {
      console.log(`Revalidating custom path: ${body.path}`);
      revalidatePath(body.path);
    }

    // Return a success response with the clean URL
    const cleanBlobUrl = new URL(blob.url);
    cleanBlobUrl.search = ''; // Remove any query parameters
    
    return NextResponse.json(
      {
        success: true,
        message: 'Blog updated and pages revalidated',
        url: cleanBlobUrl.toString(),
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
      { error: error instanceof Error ? error.message : 'Unknown error' },
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