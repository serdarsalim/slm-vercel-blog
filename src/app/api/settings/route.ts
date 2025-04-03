import { NextResponse } from 'next/server';
import { loadSettingsFromServer } from '@/app/utils/loadBlogServer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Generate a fresh timestamp for cache busting
    const timestamp = Date.now();
    
    // Load settings with cache busting
    const settings = await loadSettingsFromServer();
    
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Updated': new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ fontStyle: 'serif' }, { status: 200 });
  }
}