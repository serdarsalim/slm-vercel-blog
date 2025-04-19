// src/lib/cache-helpers.ts
/**
 * Helper function that forces ISR to refresh a page and confirms success
 */
export async function forceISRRefresh(url: string, retries = 2): Promise<boolean> {
    // Add cache-buster to ensure we get a fresh page
    const cacheBuster = Date.now();
    const fullUrl = url.includes('?') 
      ? `${url}&_isr=${cacheBuster}` 
      : `${url}?_isr=${cacheBuster}`;
    
    console.log(`🔄 Forcing ISR refresh for ${url}`);
    
    // Try multiple times if needed
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        // Set cache control headers to bypass any CDN/browser cache
        const response = await fetch(fullUrl, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-ISR-Force': 'true',
            'User-Agent': 'WriteAway-ISR-Agent/1.0'
          }
        });
        
        // Check for success
        if (response.ok) {
          // Successfully refreshed content
          console.log(`✅ ISR refresh successful for ${url} (attempt ${attempt})`);
          return true;
        } else {
          console.log(`⚠️ ISR refresh failed with status ${response.status} (attempt ${attempt})`);
          
          // Wait briefly before retry
          if (attempt <= retries) {
            await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      } catch (error) {
        console.error(`❌ Error refreshing ${url} (attempt ${attempt}):`, error);
        
        // Wait briefly before retry
        if (attempt <= retries) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
        }
      }
    }
    
    // If we get here, all attempts failed
    return false;
  }