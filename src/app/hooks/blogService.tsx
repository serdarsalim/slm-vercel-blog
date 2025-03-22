// src/app/hooks/blogService.tsx
'use client';

import { useState, useEffect } from 'react';
import { loadBlogPosts, subscribeToPostUpdates, getPostBySlug } from '../utils/loadBlogPost';
import type { BlogPost } from '../types/blogpost';

// Hook for blog post list
export function useBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        // Will only return posts with load: true
        const data = await loadBlogPosts();
        
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
    
    fetchData();
    
    // Subscribe to post updates
    const unsubscribe = subscribeToPostUpdates((newPosts) => {
      if (isMounted) {
        setPosts(newPosts);
      }
    });
    
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { posts, loading };
}

// Hook for a single blog post by slug
export function usePostBySlug(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    async function fetchPost() {
      try {
        const data = await getPostBySlug(slug);
        
        if (isMounted) {
          setPost(data);
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
  }, [slug]);

  return { post, loading, error };
}