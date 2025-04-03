// Create this at: /src/app/api/settings/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { revalidateTag } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Saving settings:', body);
    
    // Create JSON string from settings object
    const settingsJson = JSON.stringify(body);
    
    // Upload to Blob storage
    const blob = await put('settings.json', settingsJson, {
      access: 'public',
      addRandomSuffix: false, // Overwrite the file
    });
    
    // Revalidate the settings cache tag to ensure fresh data
    revalidateTag('settings');
    
    console.log('Settings saved successfully to:', blob.url);
    
    return NextResponse.json({ success: true, url: blob.url }, {
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}