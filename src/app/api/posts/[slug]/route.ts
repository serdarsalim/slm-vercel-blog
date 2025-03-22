// src/app/api/revalidate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';

// Add this handler to continue serving the file on GET requests
export async function GET(request: NextRequest) {
  try {
    // Redirect to the actual blob storage URL where your CSV is stored
    // (If you want to keep the direct download functionality)
    return NextResponse.redirect('https://your-blob-storage-url/blogPosts.csv');
  } catch (error) {
    return NextResponse.json({ error: 'Failed to serve CSV' }, { status: 500 });
  }
}

// This is the handler your Google Apps Script needs for POST requests
export async function POST(request: NextRequest) {
  const secretToken = process.env.REVALIDATION_SECRET;
  
  try {
    const body = await request.json();
    
    // Validate the secret token
    if (body.secret !== secretToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Handle the CSV content and store it
    if (body.csvContent) {
      // Upload to Vercel Blob
      const blob = await put('blogPosts.csv', body.csvContent, {
        access: 'public',
        contentType: 'text/csv'
      });
      
      // Revalidate paths
      if (body.path) {
        revalidatePath(body.path);
      }
      revalidatePath('/');
      
      return NextResponse.json({ 
        success: true, 
        message: "CSV processed and site revalidated",
        url: blob.url
      });
    } else {
      return NextResponse.json({ error: 'No CSV content provided' }, { status: 400 });
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