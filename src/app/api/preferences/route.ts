// src/app/api/preferences/route.ts
// Add these important configurations at the top:
export const runtime = 'nodejs'; // Use Node.js runtime to match revalidate route
export const dynamic = 'force-dynamic'; // Already have this, but keep it
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Generate strong cache busters
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    
    // Add BOTH to the URL
    const fullUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vRIZrizw82G-s5sJ_wHvXv4LUBStl-iS3G8cpJ3bAyDuBI9cjvrEkj_-dl97CccPAQ0R7fKiP66BiwZ/pub?gid=337002501&single=true&output=csv`;
    
    console.log(`Fetching preferences from: ${fullUrl}`);
    
    // Use these headers to force freshness
    const response = await fetch(fullUrl, {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-store, must-revalidate, max-age=0',
        'Expires': '0',
        'X-Request-Time': timestamp.toString()
      }
    });
    
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
        'Expires': '0',
        'X-Generated-At': new Date().toISOString() // Add timestamp for debugging
      }
    });
  } catch (error) {
    console.error('Error fetching preferences CSV:', error);
    throw error; // Let the error propagate up
  }
}