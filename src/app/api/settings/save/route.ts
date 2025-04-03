// Create this at: /src/app/api/settings/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { revalidateTag } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In the API route for saving settings
export async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      console.log('Saving settings:', body);
      
      // Create CSV string from settings object
      const csvContent = 'Settings,type,value\nEditor Layout,font style,' + body.fontStyle;
      
      // Upload to Blob storage as CSV
      const blob = await put('settings.csv', csvContent, {
        access: 'public',
        addRandomSuffix: false, // Overwrite the file
      });
      
      // Revalidate the settings cache tag
      revalidateTag('settings');
      
      console.log('Settings saved successfully to:', blob.url);
      
      return NextResponse.json({ success: true, url: blob.url });
    } catch (error) {
      console.error('Error saving settings:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }