import { NextResponse } from 'next/server';
import { loadSettingsFromServer } from '@/app/utils/loadBlogServer';

export const dynamic = 'force-dynamic';

// In /api/settings/route.ts
export async function GET() {
  try {
    const settings = await loadSettingsFromServer();
    
    // Instead of sending JSON, send the CSV text directly
    return new Response(
      'Settings,type,value\nEditor Layout,font style,' + settings.fontStyle, 
      {
        headers: {
          'Content-Type': 'text/csv',
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    // Fallback for errors
    return new Response(
      'Settings,type,value\nEditor Layout,font style,serif', 
      { status: 200 }
    );
  }
}