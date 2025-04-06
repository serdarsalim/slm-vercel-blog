// src/app/utils/loadBlogServer.ts - simplified version
import Papa from 'papaparse';
import type { BlogPost } from '@/app/types/blogpost';

// Use node-fetch in server environment
let fetch: any;
if (typeof window === 'undefined') {
  // Server-side
  fetch = global.fetch;
} else {
  // Client-side
  fetch = window.fetch;
}

// Define BlogPost with the missing 'load' property
interface ExtendedBlogPost extends BlogPost {
  load: boolean;
}

// Simplified with just one primary source and one fallback
// No Vercel Blob storage needed
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIZrizw82G-s5sJ_wHvXv4LUBStl-iS3G8cpJ3bAyDuBI9cjvrEkj_-dl97CccPAQ0R7fKiP66BiwZ/pub?gid=337002501&single=true&output=csv';
const FALLBACK_URL = process.env.NODE_ENV === 'production'
  ? 'https://www.writeaway.blog/data/blogPosts.csv'
  : '/data/blogPosts.csv';
const TIMEOUT_MS = 10000;

function parseBlogData(item: Record<string, any>): ExtendedBlogPost {
  try {
    // Parse loadPost first for optimization
    const load = item.load === 'TRUE' || 
                 item.load === 'true' || 
                 item.load === true;
    
    return {
      load,
      id: item.id?.toString() || "0",
      title: item.title || 'Untitled Post',
      slug: item.slug || 'untitled-post',
      excerpt: item.excerpt || '',
      content: item.content || '',
      author: item.author || 'Anonymous',
      date: item.date || new Date().toISOString().split('T')[0],
      categories: item.categories ? 
        (typeof item.categories === 'string' ? 
          item.categories.split(',').map((cat: string) => cat.trim()) : 
          Array.isArray(item.categories) ? item.categories : []
        ) : [],
      featuredImage: item.featuredImage || 'https://unsplash.com/photos/phIFdC6lA4E/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTF8fG1vdW50YWluc3xlbnwwfHx8fDE3NDM0MDM1Mjl8MA&force=true&w=640',
      featured: item.featured === 'TRUE' || item.featured === 'true' || item.featured === true,
      comment: item.comment === 'TRUE' || item.comment === 'true' || item.comment === true || (item.comment === undefined),
      socmed: item.socmed === 'TRUE' || item.socmed === 'true' || item.socmed === true || (item.socmed === undefined)  
    };
  } catch (error) {
    console.error("Error parsing blog post data:", error, item);
    return {
      load: false,
      id: "0",
      title: 'Error Post',
      slug: 'error-post',
      excerpt: 'There was an error loading this post',
      content: 'There was an error loading this post content',
      author: 'System',
      date: new Date().toISOString().split('T')[0],
      categories: ['error'],
      featuredImage: 'https://unsplash.com/photos/phIFdC6lA4E/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTF8fG1vdW50YWluc3xlbnwwfHx8fDE3NDM0MDM1Mjl8MA&force=true&w=640',
      featured: false,
      comment: false,
      socmed: false
    };
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Main function to load blog posts - can be used in server components
export async function loadBlogPostsServer(): Promise<BlogPost[]> {
  console.log("Loading blog posts from server");
  
  try {
    // First try: Google Sheets (primary source)
    console.log("Trying primary source: Google Sheets");
    try {
      // Add cache busting params but only in development
      const timestamp = process.env.NODE_ENV === 'development' 
  ? (GOOGLE_SHEETS_URL.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`)
  : '';
  
const response = await fetchWithTimeout(`${GOOGLE_SHEETS_URL}${timestamp}`, {
        next: { 
          tags: ['posts'],
          // Add revalidate only in production to enable ISR
          ...(process.env.NODE_ENV === 'production' && { revalidate: 60 * 60 * 24 * 30 })
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      if (!csvText || csvText.trim().length === 0) {
        throw new Error('Empty CSV response');
      }
      
      const result = Papa.parse(csvText, { 
        header: true,
        skipEmptyLines: true,
      });
      
      if (!Array.isArray(result.data) || result.data.length === 0) {
        throw new Error('No valid data in CSV');
      }
      
      // Parse all posts but only return those with load: true
      const allPosts = result.data.map(parseBlogData).filter(Boolean);
      const posts = allPosts.filter(post => post.load);
      
      console.log(`Successfully loaded ${posts.length} posts from Google Sheets`);
      return posts;
    } catch (sheetsError) {
      console.error("Google Sheets failed, trying local fallback:", sheetsError.message);
      
      // Fallback: Local file
      // For server components, read the file directly
      if (typeof window === 'undefined' && FALLBACK_URL.startsWith('/')) {
        const fs = require('fs');
        const path = require('path');
        const publicDir = path.join(process.cwd(), 'public');
        const filePath = path.join(publicDir, FALLBACK_URL);
        
        try {
          const csvText = fs.readFileSync(filePath, 'utf8');
          const result = Papa.parse(csvText, { 
            header: true,
            skipEmptyLines: true,
          });
          
          const allPosts = result.data.map(parseBlogData).filter(Boolean);
          const posts = allPosts.filter(post => post.load);
          
          console.log(`Successfully loaded ${posts.length} posts from local file`);
          return posts;
        } catch (fsError) {
          console.error("Error reading local file:", fsError);
          return [];
        }
      } else {
        // For client-side or absolute URLs
        const response = await fetchWithTimeout(FALLBACK_URL);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        const result = Papa.parse(csvText, { 
          header: true,
          skipEmptyLines: true,
        });
        
        const allPosts = result.data.map(parseBlogData).filter(Boolean);
        const posts = allPosts.filter(post => post.load);
        
        console.log(`Successfully loaded ${posts.length} posts from fallback URL`);
        return posts;
      }
    }
  } catch (error) {
    console.error("All blog post sources failed:", error.message);
    return []; // Return empty array as last resort
  }
}

// Get a specific post by slug - can be used in server components
export async function getPostBySlugServer(slug: string): Promise<BlogPost | null> {
  try {
    console.log(`Looking for post with slug: "${slug}"`);
    
    // Try to get all posts
    const posts = await loadBlogPostsServer();
    
    // Find the post with the matching slug
    const post = posts.find(p => p.slug === slug);
    
    if (!post) {
      console.warn(`Post with slug "${slug}" not found`);
      return null;
    }
    
    console.log(`Found post: ${post.title}`);
    return post;
  } catch (error) {
    console.error(`Failed to get post ${slug}:`, error);
    return null;
  }
}