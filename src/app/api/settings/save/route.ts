// src/app/api/settings/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { revalidateTag } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
      // Read as text instead of JSON
      const csvContent = await request.text();
      console.log('Received CSV content:', csvContent);
      
      // Validate it's in CSV format
      if (!csvContent.includes('Settings,type,value')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid CSV format' 
        }, { status: 400 });
      }
      
      // Add timestamp to log
      console.log('Processing settings update at:', new Date().toISOString());
      
      // Upload directly to Blob storage with explicit content type
      const blob = await put('settings.csv', csvContent, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'text/csv'
      });
      
      // Revalidate the settings cache tag
      revalidateTag('settings');
      
      console.log('Settings saved successfully to:', blob.url);
      
      // Return success in CSV format that client expects
      const successCsv = 'Status,url\nSuccess,' + blob.url;
      
      return new Response(successCsv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // Return error in CSV format
      const errorCsv = 'Status,error\nError,' + 
        (error instanceof Error ? error.message : 'Unknown error');
      
      return new Response(errorCsv, {
        status: 500,
        headers: {
          'Content-Type': 'text/csv'
        }
      });
    }
}