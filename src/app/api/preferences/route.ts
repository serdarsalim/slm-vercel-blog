// src/app/api/preferences/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';

// Google Sheets URL for preferences
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIZrizw82G-s5sJ_wHvXv4LUBStl-iS3G8cpJ3bAyDuBI9cjvrEkj_-dl97CccPAQ0R7fKiP66BiwZ/pub?gid=1665518073&single=true&output=csv';

// Convert CSV to structured preferences object matching YOUR actual sheet structure
// Convert CSV to structured preferences object matching YOUR actual sheet structure
const parsePreferencesCSV = (csvText) => {
  try {
    console.log('Raw CSV:', csvText.substring(0, 200)); // Log the beginning of the CSV
    
    // Parse CSV to records
    const records = parse(csvText, { 
      columns: true, 
      skip_empty_lines: true,
      trim: true // Trim whitespace from values
    });
    
    console.log('Parsed records:', records);
    
    // Default preferences
    const preferences = {
      fontStyle: 'serif',
    };
    
    // Process each row based on YOUR sheet structure
    records.forEach(record => {
      // Check for fontStyle in the Preference column
      if (record.Preference === 'fontStyle') {
        preferences.fontStyle = record.value;
        console.log(`Found font style preference: ${record.value}`);
      }
      
      // Add other preference mappings as needed
      // Example:
      // if (record.Preference === 'blogTitle') {
      //   preferences.blogTitle = record.value;
      // }
    });
    
    console.log('Final preferences:', preferences);
    return preferences;
    
  } catch (error) {
    console.error("Error parsing CSV:", error);
    console.error("CSV content:", csvText);
    return { fontStyle: 'serif' };
  }
};

// Rest of your code remains the same
let preferencesCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function GET(request: NextRequest) {
  const now = Date.now();
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
  
  // Use cache if available and not forced refresh
  if (!forceRefresh && preferencesCache && (now - cacheTimestamp < CACHE_TTL)) {
    console.log('Serving preferences from memory cache (age:', Math.round((now - cacheTimestamp)/1000) + 's)');
    return NextResponse.json(preferencesCache, {
      headers: {
        'Cache-Control': 'private, max-age=0',
        'X-Cache': 'HIT',
      }
    });
  }
  
  try {
    // Add cache buster for development
    const cacheBuster = process.env.NODE_ENV === 'development' 
      ? `&t=${Date.now()}` 
      : '';
    
    // Fetch preferences from Google Sheets  
    console.log(`Fetching preferences from: ${GOOGLE_SHEETS_URL}`);
    const response = await fetch(`${GOOGLE_SHEETS_URL}${cacheBuster}`, {
      cache: 'no-store',
      next: { tags: ['preferences'] }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const csvText = await response.text();
    const preferences = parsePreferencesCSV(csvText);
    
    // Update cache
    preferencesCache = preferences;
    cacheTimestamp = now;
    
    console.log('Successfully fetched fresh preferences from Google Sheets');
    
    return NextResponse.json(preferences, {
      headers: {
        'Cache-Control': 'private, max-age=0',
        'X-Cache': 'MISS'
      }
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    
    // Return cached preferences if available, otherwise defaults
    return NextResponse.json(
      preferencesCache || { fontStyle: 'serif' }, 
      { 
        headers: {
          'Cache-Control': 'private, max-age=0',
          'X-Error': error instanceof Error ? error.message : String(error)
        }
      }
    );
  }
}