// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

// Set runtime to nodejs (required for blob operations)
export const runtime = 'nodejs';

// GET handler to respond to browser requests
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({ 
      message: "This endpoint accepts POST requests to update blog content" 
    });
  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    });
  }
}

// POST handler for the Google Apps Script
export async function POST(request: NextRequest) {
  const secretToken = process.env.REVALIDATION_SECRET;
  
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the secret token
    if (body.secret !== secretToken) {
      console.log('Token validation failed');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
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
      });
    } else {
      return NextResponse.json({ 
        error: 'No CSV content provided' 
      }, { 
        status: 400 
      });
    }
  } catch (error) {
    console.error("Error in revalidation API:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { 
      status: 500 
    });
  }
}