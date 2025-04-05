'use client';

import { useState, useEffect } from 'react';
import type { BlogPost } from '../types/blogpost';

// Hook for using pre-fetched blog posts (passed from server components)
export function useBlogPosts(initialPosts: BlogPost[] = []) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);

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
        // Use server API endpoint without cache busting
        // The revalidation system will handle freshness
        const response = await fetch('/api/posts');
        
        // Handle API errors
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the JSON response
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
export function usePostBySlug(slug: string, initialPost: BlogPost | null = null) {
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [loading, setLoading] = useState(initialPost === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // If we already have the post from the server, use it
    if (initialPost) {
      setPost(initialPost);
      setLoading(false);
      return; // Don't fetch again if we have initial data
    }
    
    let isMounted = true;
    
    async function fetchPost() {
      try {
        // Simple fetch without cache busting - rely on ISR
        const response = await fetch(`/api/posts/${slug}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch post: ${response.status}`);
        }
        
        const postData = await response.json();
        
        if (isMounted) {
          setPost(postData);
          setLoading(false);
        }
      } catch (err) {
        console.error(`Failed to load post with slug ${slug}:`, err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setLoading(false);
        }
      }
    }
    
    fetchPost();
    
    return () => {
      isMounted = false;
    };
  }, [slug, initialPost]);

  return { post, loading, error };
}

// Module-level preferences cache 
// Short client-side cache to prevent excessive API calls
const prefCache = {
  data: null,
  lastFetched: 0,
  TTL: 5 * 60 * 1000 // 5 minutes
};

// Get preferences with ISR compatibility
export async function getPreferences() {
  try {
    const now = Date.now();
    
    // Use client cache if still valid
    if (prefCache.data && (now - prefCache.lastFetched < prefCache.TTL)) {
      return prefCache.data;
    }
    
    // Fetch from API without cache busting - rely on ISR
    const response = await fetch('/api/preferences');
    
    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }
    
    const csvText = await response.text();
    
    // Process the CSV
    const lines = csvText.split('\n');
    let preferences = { fontStyle: 'serif' }; // Default
    
    if (lines.length >= 2) {
      const columns = lines[1].split(',');
      if (columns.length >= 3) {
        preferences = { fontStyle: columns[2].trim() };
      }
    }
    
    // Update cache
    prefCache.data = preferences;
    prefCache.lastFetched = now;
    
    return preferences;
  } catch (error) {
    console.error('Error fetching preferences:', error);
    
    // Use cached data as fallback if available
    if (prefCache.data) {
      return prefCache.data;
    }
    
    // Last resort default
    return { fontStyle: 'serif' };
  }
}

// Hook to use preferences
export function usePreferences() {
  const [preferences, setPreferences] = useState({ fontStyle: 'serif' });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;
    
    async function loadPreferences() {
      const fetchedPreferences = await getPreferences();
      if (isMounted) {
        setPreferences(fetchedPreferences);
        setLoading(false);
      }
    }
    
    loadPreferences();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Add refresh function for manual updates
  const refreshPreferences = async () => {
    setLoading(true);
    prefCache.lastFetched = 0; // Force refresh
    const freshPreferences = await getPreferences();
    setPreferences(freshPreferences);
    setLoading(false);
  };
  
  return { preferences, loading, refreshPreferences };
}