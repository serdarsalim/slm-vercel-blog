import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Add timestamp to prevent caching
    const timestamp = Date.now();
    const randomValue = Math.random();
    
    // Fetch the original CSV directly
    const response = await fetch(
      `https://9ilxqyx7fm3eyyfw.public.blob.vercel-storage.com/preferences.csv?t=${timestamp}&r=${randomValue}`,
      {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-store'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch preferences: ${response.status}`);
    }
    
    // Get the raw CSV text
    const csvText = await response.text();
    
    // Return the exact CSV from Blob storage without modifying it
    return new Response(csvText, {
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching preferences CSV:', error);
    throw error; // Let the error propagate up
  }
}