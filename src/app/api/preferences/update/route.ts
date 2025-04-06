// src/app/api/preferences/update/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  console.log('POST to /api/preferences/update - Settings-only update');
  
  // Use your environment variable for the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    console.log('Received settings update request');

    // Validate the secret token
    if (body.secret !== secretToken) {
      console.log('Invalid token provided for settings update');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify this is a settings-only update
    if (body.updateType !== 'settings-only') {
      console.log('Missing settings-only flag');
      return NextResponse.json({ 
        error: 'Invalid request type'
      }, { status: 400 });
    }

    console.log('Revalidating ONLY preferences data');
    
    // ONLY revalidate the preferences data, nothing else
    revalidateTag('preferences');
    revalidatePath('/api/preferences');
    
    // Do NOT revalidate blog posts or other content!
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing settings update:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}