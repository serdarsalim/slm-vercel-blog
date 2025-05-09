// src/app/api/revalidate/route.ts

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

// GET handler – for direct API access and testing
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
    // Get the parameters to revalidate
    const path = request.nextUrl.searchParams.get('path') || '/';
    const slug = request.nextUrl.searchParams.get('slug') || null;
    const handle = request.nextUrl.searchParams.get('handle') || null;
    
    // Log the revalidation attempt
    console.log(`Revalidating: ${path}${slug ? ` for slug: ${slug}` : ''}${handle ? ` for author: ${handle}` : ''}`);
    
    // Step 1: Revalidate tags - affects all post-related pages
    console.log('Revalidating tags: posts');
    revalidateTag('posts');
    revalidateTag('authors'); // Add this line

    // Step 2: Revalidate specific paths for comprehensive coverage
    console.log('Revalidating common paths');
    revalidatePath('/', 'page');              // Home page
    revalidatePath('/authors', 'page'); // Add this line

    // Step 3: If a specific slug and handle are provided, handle that explicitly
    if (slug && handle) {
      console.log(`Specifically revalidating: /${handle}/${slug}`);
      revalidatePath(`/${handle}/${slug}`, 'page');
    } else if (path !== '/') {
      // If a custom path is provided and it's not one we already revalidated
      console.log(`Revalidating custom path: ${path}`);
      revalidatePath(path, 'page');
    }
    
    return NextResponse.json({
      revalidated: true,
      message: slug && handle 
        ? `Revalidated post: ${slug} for author: ${handle} and related paths` 
        : `Revalidated ${path} and related paths`,
      timestamp: new Date().toISOString(),
      warning: "Newly added content may take a moment to become available as pages regenerate"
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json({
      revalidated: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// POST handler – for server-to-server API calls
export async function POST(request: NextRequest) {
  console.log('POST request to /api/revalidate');

  // Use your environment variable or a fallback for the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    console.log('Received revalidation request:', JSON.stringify(body).substring(0, 200));

    // Validate the secret token (check both formats)
    if (body.secret !== secretToken && body.token !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Test mode check
    if (body.test === true || body.test === 'true') {
      console.log('API key test successful');
      return NextResponse.json({ 
        success: true, 
        message: 'API key is valid',
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log('Running cache revalidation');
    
    // Extract parameters
    const path = body.path || '/';
    const slug = body.slug || null;
    const handle = body.author_handle || body.handle || null;
    
    // Step 1: Revalidate tags - affects all post-related pages
    console.log('Revalidating tags: posts');
    revalidateTag('posts');
    revalidateTag('authors');
    // Step 2: Revalidate specific paths for comprehensive coverage
    console.log('Revalidating common paths');
    revalidatePath('/', 'page');              // Home page
    revalidatePath('/authors', 'page'); 
    // Step 3: If a specific slug and handle are provided, handle that explicitly
    if (slug && handle) {
      console.log(`Specifically revalidating: /${handle}/${slug}`);
      revalidatePath(`/${handle}/${slug}`, 'page');
    } else if (path !== '/') {
      // If a custom path is provided and it's not one we already revalidated
      console.log(`Revalidating custom path: ${path}`);
      revalidatePath(path, 'page');
    }
    
    return NextResponse.json({
      success: true,
      message: slug && handle 
        ? `Revalidated post: ${slug} for author: ${handle} and related paths` 
        : `Revalidated ${path} and related paths`,
      timestamp: new Date().toISOString(),
      warning: "Newly added content may take a moment to become available as pages regenerate"
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error processing revalidation request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
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