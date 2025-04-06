// src/app/api/preferences/update/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  console.log('POST to /api/preferences/update');
  
  // Use your environment variable for the secret token
  const secretToken = process.env.REVALIDATION_SECRET || 'your_default_secret';

  try {
    const body = await request.json();
    console.log('Received preferences update request');

    // Validate the secret token
    if (body.secret !== secretToken) {
      console.log('Invalid token provided');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log('Revalidating preferences data');
    
    // Revalidate both the tag and path
    revalidateTag('preferences');
    revalidatePath('/api/preferences');
    
    // Clear any server-side caches
    global.preferencesCache = null;
    
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
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