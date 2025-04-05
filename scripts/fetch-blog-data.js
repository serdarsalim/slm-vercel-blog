const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { parse } = require('csv-parse/sync');

const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIZrizw82G-s5sJ_wHvXv4LUBStl-iS3G8cpJ3bAyDuBI9cjvrEkj_-dl97CccPAQ0R7fKiP66BiwZ/pub?gid=337002501&single=true&output=csv';
const OUTPUT_FILE_PATH = path.join(__dirname, '../public/data/blogPosts.csv');

async function fetchAndSaveBlogData() {
  console.log('🔄 Fetching blog data from Google Sheets...');
  
  try {
    // Fetch data from Google Sheets
    const response = await fetch(GOOGLE_SHEETS_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    // Parse CSV to validate and potentially transform data
    const records = parse(csvText, { 
      columns: true, 
      skip_empty_lines: true,
      relax_quotes: true, // Help with handling complex content fields
      relax_column_count: true
    });
    
    console.log(`✅ Successfully fetched ${records.length} blog posts`);
    
    // Ensure directory exists
    const dir = path.dirname(OUTPUT_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write the CSV data directly to file
    fs.writeFileSync(OUTPUT_FILE_PATH, csvText);
    console.log(`📝 Blog data written to ${OUTPUT_FILE_PATH}`);
    
  } catch (error) {
    console.error('❌ Error fetching blog data:', error);
    // Don't fail the build - use existing fallback data
    console.log('⚠️ Using existing fallback data if available');
  }
}

// Execute script
fetchAndSaveBlogData();