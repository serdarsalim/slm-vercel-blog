// src/lib/cache-helpers.ts

/**
 * Filters paths to exclude API routes and other non-content routes
 * @param paths Array of paths to filter
 * @returns Filtered array of paths that can be safely warmed
 */
export function filterWarmablePaths(paths: string[]): string[] {
    return paths.filter(path => {
      // Normalize path to start with /
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      
      // Skip any path that starts with /api/
      if (normalizedPath.startsWith('/api/')) {
        console.log(`⚠️ Skipping API route: ${path}`);
        return false;
      }
      
      // Skip paths with 'api' as the first segment
      const segments = normalizedPath.split('/').filter(Boolean);
      if (segments.length > 0 && segments[0].toLowerCase() === 'api') {
        console.log(`⚠️ Skipping path with 'api' handle: ${path}`);
        return false;
      }
      
      // Skip other reserved segments
      const reservedSegments = ['admin', '_next', 'static', 'public', 'assets', 'images'];
      if (segments.length > 0 && reservedSegments.includes(segments[0].toLowerCase())) {
        console.log(`⚠️ Skipping reserved path: ${path}`);
        return false;
      }
      
      return true;
    });
  }
  
  /**
   * Forces an ISR refresh for a URL by making a fetch request with cache busting
   * @param url Full URL to refresh
   * @param retries Number of retry attempts
   * @returns Promise<boolean> indicating success
   */
  export async function forceISRRefresh(url: string, retries = 1): Promise<boolean> {
    try {
      // Add a cache-busting parameter to ensure we get a fresh response
      const cacheBuster = `_cache_bust=${Date.now()}`;
      const refreshUrl = url.includes('?') 
        ? `${url}&${cacheBuster}`
        : `${url}?${cacheBuster}`;
      
      // Make a request to trigger ISR regeneration
      const response = await fetch(refreshUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'X-Force-ISR': '1'
        }
      });
      
      if (response.ok) {
        return true;
      }
      
      // If we have retries left and it's a server error, try again
      if (retries > 0 && response.status >= 500 && response.status < 600) {
        console.log(`Retrying ISR refresh for ${url}...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return forceISRRefresh(url, retries - 1);
      }
      
      return false;
    } catch (error) {
      console.error(`Error refreshing ${url}:`, error);
      
      // Retry on network errors if we have retries left
      if (retries > 0) {
        console.log(`Retrying ISR refresh for ${url} after error...`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        return forceISRRefresh(url, retries - 1);
      }
      
      return false;
    }
  }