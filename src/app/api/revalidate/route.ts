// src/app/api/update-blog-data/route.ts

export const runtime = 'nodejs';

import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate token
    if (body.secret !== REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    // Get CSV content and validate
    const csvContent = body.csvContent;
    if (!csvContent) {
      return NextResponse.json({ message: 'No CSV content provided' }, { status: 400 });
    }
    
    // Upload to Vercel Blob
    const blob = await put('blogPosts.csv', csvContent, {
      contentType: 'text/csv',
      access: 'public',
    });
    
    // Revalidate blog pages
    revalidatePath('/blog');
    
    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      message: 'Blog data updated successfully' 
    });
    
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ 
      message: 'Error updating blog data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
