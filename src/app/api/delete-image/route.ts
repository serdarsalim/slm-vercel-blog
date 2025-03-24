export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';

// Common function to handle image deletion logic
async function handleDeleteImages(request: NextRequest, requestBody: any) {
  console.log('Processing delete images request');

  // Use your environment variable or a fallback for the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'bugunyapicamlanseni';

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

    // Support both single pathname and array of pathnames
    let pathnames: string[] = [];
    
    if (typeof requestBody.pathname === 'string') {
      // Single pathname
      pathnames = [requestBody.pathname];
    } else if (Array.isArray(requestBody.pathnames)) {
      // Multiple pathnames
      pathnames = requestBody.pathnames;
    } else {
      return NextResponse.json({ 
        error: 'Either pathname (string) or pathnames (array) is required' 
      }, { status: 400 });
    }

    if (pathnames.length === 0) {
      return NextResponse.json({ error: 'No pathnames provided' }, { status: 400 });
    }

    console.log(`Attempting to delete ${pathnames.length} blob(s):`);
    pathnames.forEach(path => console.log(`- ${path}`));

    // Delete each blob and collect results
    const results = await Promise.allSettled(
      pathnames.map(async (path) => {
        try {
          const result = await del(path);
          console.log(`Successfully deleted: ${path}`);
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

    // Parse results for response
    const successful = results.filter(
      r => r.status === 'fulfilled' && r.value.success
    ).length;
    
    const failed = results.length - successful;
    
    // Collect errors for debugging
    const errors = results
      .filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
      .map(r => {
        if (r.status === 'rejected') return r.reason;
        return r.status === 'fulfilled' ? r.value.error : 'Unknown error';
      });

    return NextResponse.json({
      success: failed === 0,
      deleted: successful,
      failed,
      errors: errors.length > 0 ? errors : undefined,
      message: successful > 0 
        ? `Successfully deleted ${successful} image${successful !== 1 ? 's' : ''}`
        : 'No images were deleted'
    }, { status: failed === 0 ? 200 : 207 }); // Use 207 Multi-Status for partial success
    
  } catch (error) {
    console.error('Error processing delete request:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE handler
export async function DELETE(request: NextRequest) {
  // For DELETE requests, we need to read the JSON body
  const body = await request.json().catch(() => ({}));
  return handleDeleteImages(request, body);
}

// Adding POST handler to support the Google Apps Script
export async function POST(request: NextRequest) {
  console.log('Received POST request for image deletion');
  // Parse the request body
  const body = await request.json().catch(() => ({}));
  
  // Check if this is a delete action from Google Apps Script
  if (body.action === 'delete') {
    return handleDeleteImages(request, body);
  }
  
  return NextResponse.json({ 
    error: 'Invalid action. For POST requests, specify action: "delete"' 
  }, { status: 400 });
}

// CORS preflight handler - allow both DELETE and POST methods
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}