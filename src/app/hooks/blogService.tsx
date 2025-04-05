// src/app/hooks/blogService.tsx
'use client';

import { useState, useEffect } from 'react';
import type { BlogPost } from '../types/blogpost';

// Hook for using pre-fetched blog posts (passed from server components)
// Enhanced version of useBlogPosts with better cache busting
export function useBlogPosts(initialPosts: BlogPost[] = []) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);

  // This hook now primarily relies on initial data from the server component
  // But can optionally refresh data from the client if initialPosts is empty
  useEffect(() => {
    // If we already have posts from the server, no need to fetch again
    if (initialPosts.length > 0) {
      setPosts(initialPosts);
      setLoading(false);
      return;
    }

    // Only fetch if we don't have initialPosts (fallback for old components)
    let isMounted = true;
    
    async function fetchData() {
      try {
        // Enhanced fetch with cache busting
        const timestamp = Date.now();
        const nonce = Math.random().toString(36).substring(2, 15);
        
        // Try the dedicated posts API first
        const response = await fetch(`/api/posts?t=${timestamp}&nonce=${nonce}`, {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-store, must-revalidate',
            'Expires': '0'
          }
        });
        
        // If API posts endpoint doesn't exist, fall back to revalidate endpoint
        if (!response.ok) {
          console.log('Posts API endpoint failed, falling back to revalidate endpoint');
          const fallbackResponse = await fetch(`/api/revalidate?t=${timestamp}&nonce=${nonce}`, {
            cache: 'no-store',
            headers: {
              'Pragma': 'no-cache',
              'Cache-Control': 'no-store, must-revalidate',
              'Expires': '0'
            }
          });
          
          if (!fallbackResponse.ok) {
            throw new Error(`HTTP error! status: ${fallbackResponse.status}`);
          }
          
          const text = await fallbackResponse.text();
          
          // Parse CSV to JSON
          const Papa = (await import('papaparse')).default;
          const result = Papa.parse(text, { 
            header: true, 
            skipEmptyLines: true,
            dynamicTyping: true
          });
          
          if (isMounted) {
            // Filter to only include posts with load: true
            const loadedPosts = result.data
              .filter((post: any) => post.load === 'TRUE' || post.load === true)
              .map((post: any) => ({
                id: post.id?.toString() || "0",
                title: post.title || 'Untitled Post',
                slug: post.slug || 'untitled-post',
                excerpt: post.excerpt || '',
                content: post.content || '',
                author: post.author || 'Anonymous',
                date: post.date || new Date().toISOString().split('T')[0],
                categories: post.categories ? 
                  (typeof post.categories === 'string' ? 
                    post.categories.split(',').map((cat: string) => cat.trim()) : 
                    Array.isArray(post.categories) ? post.categories : []
                  ) : [],
                featuredImage: post.featuredImage || 'https://unsplash.com/photos/phIFdC6lA4E/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTF8fG1vdW50YWluc3xlbnwwfHx8fDE3NDM0MDM1Mjl8MA&force=true&w=640',
                featured: post.featured === 'TRUE' || post.featured === 'true' || post.featured === true
              }));
              
            setPosts(loadedPosts);
            setLoading(false);
          }
          return;
        }
        
        // If we get here, the posts API endpoint worked
        const data = await response.json();
        
        if (isMounted) {
          setPosts(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load blog posts:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    if (loading) {
      fetchData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [initialPosts, loading]);

  return { posts, loading };
}


// Hook for a single blog post by slug when used in a client component
// Hook for a single blog post by slug with enhanced cache busting
export function usePostBySlug(slug: string, initialPost: BlogPost | null = null) {
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [loading, setLoading] = useState(initialPost === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If we already have the post from the server, use it initially
    if (initialPost) {
      setPost(initialPost);
      setLoading(false);
    }
    
    // Always fetch for freshness, even if we have initialPost
    let isMounted = true;
    
    async function fetchPost() {
      try {
        // Enhanced fetch with strong cache busting
        const timestamp = Date.now();
        const nonce = Math.random().toString(36).substring(2, 15);
        
        // First try the API endpoint with cache busting
        const response = await fetch(`/api/posts/${slug}?t=${timestamp}&nonce=${nonce}`, {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-store, must-revalidate',
            'Expires': '0'
          }
        });
        
        if (!response.ok) {
          // If API endpoint doesn't exist, fetch all posts with cache busting
          const allPostsResponse = await fetch(`/api/revalidate?t=${timestamp}&nonce=${nonce}`, {
            cache: 'no-store',
            headers: {
              'Pragma': 'no-cache',
              'Cache-Control': 'no-store, must-revalidate',
              'Expires': '0'
            }
          });
          
          // Your existing fallback processing code...
          // (Rest of your code remains the same)
        }
        
        // If we have a specific API endpoint for the post
        const postData = await response.json();
        
        if (isMounted) {
          setPost(postData);
          setLoading(false);
        }
      } catch (err) {
        console.error(`Failed to load post with slug ${slug}:`, err);
        if (isMounted && !initialPost) { // Only set error if we don't have initialPost
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setLoading(false);
        }
      }
    }
    
    fetchPost(); // Always fetch for freshness
    
    return () => {
      isMounted = false;
    };
  }, [slug]); // Only depend on slug, not initialPost or loading

  return { post, loading, error };
}




// Module-level preferences cache
const prefCache = {
  csvData: null,
  lastFetched: 0
};

// Then replace your existing getPreferences with this:
export async function getPreferences() {
  try {
    const now = Date.now();
    
    // Skip network request if we've fetched in the last 5 minutes
    // This prevents excessive API calls on client side
    const shouldRefetch = now - prefCache.lastFetched > 5 * 60 * 1000;
    
    if (!shouldRefetch && prefCache.csvData) {
      console.log('Using cached preferences data');
      
      // Process the cached data the same way we would fresh data
      const lines = prefCache.csvData.split('\n');
      if (lines.length >= 2) {
        const columns = lines[1].split(',');
        if (columns.length >= 3) {
          const fontStyle = columns[2].trim();
          return { fontStyle };
        }
      }
    }
    
    // Add minimal cache busting for development
    const cacheBuster = process.env.NODE_ENV === 'development' 
      ? `?t=${Date.now()}` 
      : '';
    
    const response = await fetch(`/api/preferences${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }
    
    const csvText = await response.text();
    
    // Cache the raw CSV for future use
    prefCache.csvData = csvText;
    prefCache.lastFetched = now;
    
    // Process the same way as before
    const lines = csvText.split('\n');
    
    if (lines.length >= 2) {
      const columns = lines[1].split(',');
      if (columns.length >= 3) {
        const fontStyle = columns[2].trim();
        return { fontStyle };
      }
    }
    
    // Default if preferences not found
    return { fontStyle: 'serif' };
  } catch (error) {
    console.error('Error fetching preferences:', error);
    
    // If we have cached data, use it as fallback
    if (prefCache.csvData) {
      console.log('Using cached preferences as fallback after error');
      const lines = prefCache.csvData.split('\n');
      if (lines.length >= 2) {
        const columns = lines[1].split(',');
        if (columns.length >= 3) {
          const fontStyle = columns[2].trim();
          return { fontStyle };
        }
      }
    }
    
    // Last resort - return default
    return { fontStyle: 'serif' };
  }
}

// Add a hook to use the preferences
export function usePreferences() {
  const [preferences, setPreferences] = useState({ fontStyle: 'serif' });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadpreferences() {
      const fetchedpreferences = await getPreferences();
      setPreferences(fetchedpreferences);
      setLoading(false);
    }
    
    loadpreferences();
  }, []);
  
  return { preferences, loading };
}
