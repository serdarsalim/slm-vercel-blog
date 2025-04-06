// src/app/api/revalidate/route.ts

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// GET handler – for testing and triggering revalidation
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

// POST handler – simplified to just trigger revalidation
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

    // Test mode check
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

    console.log('Running cache revalidation');
    
    // Get the path to revalidate
    const path = body.path || '/blog';
    
    // Revalidate cache tags and paths
    revalidateTag('posts');
    revalidatePath(path);
    revalidatePath('/');
    revalidatePath('/blog/[slug]', 'page');
    
    // If we have slug info, revalidate that specific post too
    if (body.slug) {
      console.log(`Revalidating specific post: ${body.slug}`);
      revalidatePath(`/blog/${body.slug}`, 'page');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Blog pages revalidated',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
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