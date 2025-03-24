// src/app/api/delete-image/route.ts

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

export async function DELETE(request: NextRequest) {
  console.log('Processing delete images request');

  // Use your environment variable or a fallback for the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    // Check authorization with Bearer token
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    if (bearerToken !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get the pathname(s) from the request body
    const body = await request.json();
    
    // Support both single pathname and array of pathnames
    let pathnames: string[] = [];
    
    if (typeof body.pathname === 'string') {
      // Single pathname
      pathnames = [body.pathname];
    } else if (Array.isArray(body.pathnames)) {
      // Multiple pathnames
      pathnames = body.pathnames;
    } else {
      return NextResponse.json({ 
        error: 'Either pathname (string) or pathnames (array) is required' 
      }, { status: 400 });
    }

    if (pathnames.length === 0) {
      return NextResponse.json({ error: 'No pathnames provided' }, { status: 400 });
    }

    console.log(`Attempting to delete ${pathnames.length} blob(s)`);

    // Delete each blob and collect results
    const results = await Promise.allSettled(
      pathnames.map(async (path) => {
        try {
          const result = await del(path);
          return { path, success: true, result };
        } catch (error) {
          console.error(`Error deleting ${path}:`, error);
          return { 
            path, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );

    // Determine if all operations were successful
    const allSuccessful = results.every(
      (result) => result.status === 'fulfilled' && result.value.success
    );

    return NextResponse.json({
      success: allSuccessful,
      message: allSuccessful 
        ? 'All images deleted successfully' 
        : 'Some images failed to delete',
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : {
          success: false,
          error: 'Promise rejection'
        }
      )
    }, { status: allSuccessful ? 200 : 207 }); // Use 207 Multi-Status for partial success
    
  } catch (error) {
    console.error('Error processing delete request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}