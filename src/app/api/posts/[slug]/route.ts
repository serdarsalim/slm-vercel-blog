// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

// Set runtime to nodejs (required for blob operations)
export const runtime = 'nodejs';

// The secret token - using a fallback for development
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || 'thisneetstoworkchangethen';

// GET handler to respond to browser requests
export async function GET(request: NextRequest) {
  try {
    console.log('GET request received');
    
    return NextResponse.json({ 
      message: "This endpoint accepts POST requests to update blog content" 
    }, {
      headers: {
        // Add CORS headers to allow browser access
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// POST handler for the Google Apps Script
export async function POST(request: NextRequest) {
  console.log('POST request received');
  
  try {
    // Parse the request body
    const body = await request.json();
    console.log('Request body received, validating token...');
    
    // Validate the secret token
    if (body.secret !== REVALIDATION_SECRET) {
      console.log('Token validation failed');
      return NextResponse.json({ error: 'Invalid token' }, { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // Handle the CSV content
    if (body.csvContent) {
      console.log('Received CSV content, uploading to blob storage...');
      
      // Upload to Vercel Blob
      const blob = await put('blogPosts.csv', body.csvContent, {
        access: 'public',
        contentType: 'text/csv'
      });
      
      console.log('CSV uploaded successfully, revalidating paths...');
      
      // Revalidate paths
      if (body.path) {
        revalidatePath(body.path);
      }
      
      // Always revalidate the homepage
      revalidatePath('/');
      
      console.log('Paths revalidated');
      
      return NextResponse.json({ 
        success: true, 
        message: "CSV processed and site revalidated",
        url: blob.url
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      return NextResponse.json({ 
        error: 'No CSV content provided' 
      }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error("Error in revalidation API:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  console.log('OPTIONS request received');
  
  // Return a 204 No Content response with CORS headers
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}