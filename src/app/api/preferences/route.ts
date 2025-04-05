// src/app/api/preferences/route.ts
// Add these important configurations at the top:
export const runtime = 'nodejs'; // Use Node.js runtime to match revalidate route
export const dynamic = 'force-dynamic'; // Keep endpoint dynamic

import { NextResponse } from 'next/server';

// These variables persist between requests in production - server memory cache
let cachedCsvText = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds (shorter than blog posts)

// Google Sheets URL
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIZrizw82G-s5sJ_wHvXv4LUBStl-iS3G8cpJ3bAyDuBI9cjvrEkj_-dl97CccPAQ0R7fKiP66BiwZ/pub?gid=337002501&single=true&output=csv';

export async function GET() {
  const now = Date.now();
  
  // Check if we have valid cached preferences
  if (cachedCsvText && (now - cacheTimestamp < CACHE_TTL)) {
    console.log(`Serving preferences from memory cache (age: ${Math.round((now - cacheTimestamp)/1000)}s)`);
    
    // Return cached preferences with headers indicating cache source
    return new Response(cachedCsvText, {
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'public, max-age=1800, s-maxage=7200',
        'Expires': new Date(now + 1800000).toUTCString(),
        'X-Cache': 'HIT',
        'X-Cache-Age': `${Math.round((now - cacheTimestamp)/1000)}s`
      }
    });
  }
  
  // If we reach here, cache is empty or stale
  console.log('Preferences cache miss or expired, fetching fresh data');
  
  try {
    // Generate cache busters if needed (mainly for development)
    const queryParams = process.env.NODE_ENV === 'development' 
      ? `?t=${Date.now()}&r=${Math.random().toString(36).substring(2)}`
      : '';
    
    // Fetch from Google Sheets
    console.log(`Fetching preferences from: ${GOOGLE_SHEETS_URL}${queryParams}`);
    
    const response = await fetch(`${GOOGLE_SHEETS_URL}${queryParams}`, {
      next: { 
        tags: ['preferences'],
        // Add revalidate only in production to enable ISR
        ...(process.env.NODE_ENV === 'production' && { revalidate: 3600 })
      },
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-store, must-revalidate, max-age=0',
        'Expires': '0',
        'X-Request-Time': now.toString()
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch preferences: ${response.status}`);
    }
    
    // Get the raw CSV text
    const csvText = await response.text();
    
    // Validate it's not empty
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Empty CSV response');
    }
    
    // Update our cache
    cachedCsvText = csvText;
    cacheTimestamp = now;
    
    console.log('Successfully fetched fresh preferences from Google Sheets');
    
    // Return the CSV with cache headers
    return new Response(csvText, {
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'public, max-age=1800, s-maxage=7200',
        'Pragma': 'no-cache',
        'Expires': new Date(now + 1800000).toUTCString(),
        'X-Cache': 'MISS',
        'X-Updated': new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching preferences CSV:', error);
    
    // If we still have cached data but it's expired, use it anyway
    if (cachedCsvText) {
      console.log('Error fetching fresh data, using stale preferences cache');
      return new Response(cachedCsvText, {
        headers: {
          'Content-Type': 'text/csv',
          'Cache-Control': 'no-cache',
          'X-Cache': 'STALE',
          'X-Cache-Age': `${Math.round((now - cacheTimestamp)/1000)}s`,
          'X-Error': error.message || 'Unknown error'
        }
      });
    }
    
    // Last resort - return a minimal valid CSV with default preferences
    const defaultCsv = 'setting,value,fontStyle\ndefault,1,serif';
    
    return new Response(defaultCsv, {
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'no-cache',
        'X-Cache': 'DEFAULT',
        'X-Error': error.message || 'Unknown error'
      }
    });
  }
}