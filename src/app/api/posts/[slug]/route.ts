// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

// Export runtime config - essential for route handlers
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET handler
export async function GET(request) {
  console.log('GET request to /api/revalidate');
  return NextResponse.json(
    { message: "This endpoint is for blog content updates via POST" },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    }
  );
}

// POST handler - critical for receiving updates from Google Apps Script
export async function POST(request) {
  console.log('POST request to /api/revalidate');
  
  // Get the secret token from environment variable
  const secretToken = process.env.REVALIDATION_SECRET || 'bugunyapicamlanseni';
  
  try {
    // Parse the JSON body
    const body = await request.json();
    console.log('Request body received');
    
    // Validate the secret token
    if (body.secret !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json(
        { error: 'Invalid token' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        }
      );
    }
    
    // Check for CSV content
    if (!body.csvContent) {
      console.log('No CSV content provided');
      return NextResponse.json(
        { error: 'No CSV content provided' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
    
    // Store the CSV in Vercel Blob
    console.log('Uploading CSV to Vercel Blob');
    const blob = await put('blogPosts.csv', body.csvContent, {
      access: 'public',
      contentType: 'text/csv'
    });
    console.log('CSV uploaded successfully', blob.url);
    
    // Revalidate paths
    if (body.path) {
      console.log(`Revalidating path: ${body.path}`);
      revalidatePath(body.path);
    }
    
    // Always revalidate the homepage
    console.log('Revalidating homepage');
    revalidatePath('/');
    
    console.log('All operations completed successfully');
    
    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'CSV content updated and pages revalidated',
        url: blob.url
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown server error' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request) {
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