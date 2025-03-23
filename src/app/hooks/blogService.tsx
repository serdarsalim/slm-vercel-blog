// src/app/hooks/blogService.tsx
'use client';

import { useState, useEffect } from 'react';
import type { BlogPost } from '../types/blogpost';

// Hook for using pre-fetched blog posts (passed from server components)
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
        // Fetch from the API route
        const response = await fetch('/api/revalidate');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        
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
              featuredImage: post.featuredImage || 'https://unsplash.com/photos/HiqaKxosAUA/download?ixid=M3wxMjA3fDB8MXxhbGx8M3x8fHx8fHx8MTc0MjcxODI1MHw&force=true&w=640',
              featured: post.featured === 'TRUE' || post.featured === 'true' || post.featured === true
            }));
            
          setPosts(loadedPosts);
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
    // If we already have the post from the server, no need to fetch again
    if (initialPost) {
      setPost(initialPost);
      setLoading(false);
      return;
    }

    // Only fetch if we don't have initialPost (fallback for old components)
    let isMounted = true;
    
    async function fetchPost() {
      try {
        // First try the API endpoint
        const response = await fetch(`/api/posts/${slug}`);
        
        if (!response.ok) {
          // If API endpoint doesn't exist, fetch all posts and filter
          const allPostsResponse = await fetch('/api/revalidate');
          
          if (!allPostsResponse.ok) {
            throw new Error(`Failed to fetch posts: ${allPostsResponse.status}`);
          }
          
          const csvText = await allPostsResponse.text();
          
          // Parse CSV to JSON
          const Papa = (await import('papaparse')).default;
          const result = Papa.parse(csvText, { 
            header: true, 
            skipEmptyLines: true
          });
          
          // Find the post with matching slug
          const foundPost = result.data.find((p: any) => p.slug === slug && (p.load === 'TRUE' || p.load === true));
          
          if (!foundPost) {
            throw new Error(`Post with slug "${slug}" not found`);
          }
          
          // Convert categories to array if needed
          const categories = foundPost.categories ? 
            (typeof foundPost.categories === 'string' ? 
              foundPost.categories.split(',').map((cat: string) => cat.trim()) : 
              Array.isArray(foundPost.categories) ? foundPost.categories : []
            ) : [];
            
          const postData: BlogPost = {
            id: foundPost.id?.toString() || "0",
            title: foundPost.title || 'Untitled Post',
            slug: foundPost.slug,
            excerpt: foundPost.excerpt || '',
            content: foundPost.content || '',
            author: foundPost.author || 'Anonymous',
            date: foundPost.date || new Date().toISOString().split('T')[0],
            categories: categories,
            featuredImage: foundPost.featuredImage || 'https://unsplash.com/photos/HiqaKxosAUA/download?ixid=M3wxMjA3fDB8MXxhbGx8M3x8fHx8fHx8MTc0MjcxODI1MHw&force=true&w=640',
            featured: foundPost.featured === 'TRUE' || foundPost.featured === 'true'
          };
          
          if (isMounted) {
            setPost(postData);
            setLoading(false);
          }
          return;
        }
        
        // If we have a specific API endpoint for the post
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
    
    if (loading) {
      fetchPost();
    }
    
    return () => {
      isMounted = false;
    };
  }, [slug, initialPost, loading]);

  return { post, loading, error };
}