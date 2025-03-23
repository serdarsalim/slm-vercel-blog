// src/app/utils/loadBlogServerPost.ts
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

// In production, we primarily use the API route which fetches from Vercel Blob storage
// The local file and Google Sheets are used as fallbacks
const DIRECT_BLOB_URL = 'https://9ilxqyx7fm3eyyfw.public.blob.vercel-storage.com/blogPosts.csv';
const GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRzuUNByiRaAKH5LpQXusWmoCTku7SG7FEjEtPSHVkQDC5x5g1KLlpJJhf2GxUBIC9EgClwqS1PG-j8/pub?gid=1366419500&single=true&output=csv';
const FALLBACK_URL = '/data/blogPosts.csv';
const TIMEOUT_MS = 3000; // 3 second timeout

function parseBlogData(item: Record<string, any>): ExtendedBlogPost {
  try {
    // Parse loadPost first for optimization
    const load = item.load === 'TRUE' || 
                 item.load === 'true' || 
                 item.load === true;
    
    return {
      load,
      id: item.id?.toString() || "0", // Make sure id is a string
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
      featuredImage: item.featuredImage || 'https://unsplash.com/photos/HiqaKxosAUA/download?ixid=M3wxMjA3fDB8MXxhbGx8M3x8fHx8fHx8MTc0MjcxODI1MHw&force=true&w=1920',
      featured: item.featured === 'TRUE' || item.featured === 'true' || item.featured === true
    };
  } catch (error) {
    console.error("Error parsing blog post data:", error, item);
    return {
      load: false, // Don't load error posts by default
      id: "0",
      title: 'Error Post',
      slug: 'error-post',
      excerpt: 'There was an error loading this post',
      content: 'There was an error loading this post content',
      author: 'System',
      date: new Date().toISOString().split('T')[0],
      categories: ['error'],
      featuredImage: 'https://unsplash.com/photos/HiqaKxosAUA/download?ixid=M3wxMjA3fDB8MXxhbGx8M3x8fHx8fHx8MTc0MjcxODI1MHw&force=true&w=1920',
      featured: false
    };
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
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

// Function to fetch and process blog posts
async function fetchAndProcessPosts(url: string, isFallback = false): Promise<BlogPost[]> {
  try {
    console.log(`Fetching blog posts from: ${url}`);
    
    // Determine if this is a relative URL (for local file in public directory)
    const isRelativeUrl = url.startsWith('/') && !url.startsWith('//');
    
    // For server components and relative URLs, we need to handle differently
    let csvText: string;
    
    if (isRelativeUrl && typeof window === 'undefined') {
      // Server-side with relative URL - use fs
      const fs = require('fs');
      const path = require('path');
      const publicDir = path.join(process.cwd(), 'public');
      const filePath = path.join(publicDir, url);
      
      try {
        csvText = fs.readFileSync(filePath, 'utf8');
      } catch (fsError) {
        console.error("Error reading local file:", fsError);
        throw new Error(`Failed to read file: ${filePath}`);
      }
    } else {
      // Client-side or server-side with absolute URL
      const fetchOptions: RequestInit = {
        // Allow caching for the fallback file to improve performance
        cache: url.includes('fallbackPosts') ? 'force-cache' : 'no-store',
        headers: url.includes('fallbackPosts') ? {} : {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      };
      
      const response = await fetchWithTimeout(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      csvText = await response.text();
    }
    
    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Empty CSV response');
    }
    
    const { data, errors } = Papa.parse(csvText, { 
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0 && errors[0].code !== "TooFewFields") {
      console.warn("CSV parsing had errors:", errors);
    }

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No valid data in CSV');
    }

    // Parse all posts but only return those with load: true
    const allPosts = data.map(parseBlogData).filter(Boolean);
    
    // Early filter for posts that should be loaded
    const posts = allPosts.filter(post => post.load);
    
    console.log(`Loaded ${posts.length} posts successfully`);
    return posts; // Return only posts with load: true
  } catch (error) {
    console.error("Error in fetchAndProcessPosts:", error);
    
    if (!isFallback) {
      console.log("Primary source failed, trying fallback source");
      
      // Try fallback sources in sequence
      try {
        // Try local file first
        return await fetchAndProcessPosts(FALLBACK_URL, true);
      } catch (localError) {
        console.error("Local fallback failed, trying Google Sheets", localError);
        // If local file fails, try Google Sheets
        return fetchAndProcessPosts(GOOGLE_SHEETS_URL, true);
      }
    }
    
    console.error("All data sources failed, no posts available", error);
    return []; // Return empty array as last resort
  }
}

// Main function to load blog posts - can be used in server components
export async function loadBlogPostsServer(): Promise<BlogPost[]> {
  try {
    // Always try the Vercel Blob URL first
    try {
      return await fetchAndProcessPosts(DIRECT_BLOB_URL);
    } catch (blobError) {
      console.error("Direct Blob access failed, trying local fallback file", blobError);
      
      // Try the local fallback file
      try {
        return await fetchAndProcessPosts(FALLBACK_URL);
      } catch (localError) {
        console.error("Local fallback failed, trying Google Sheets", localError);
        
        // Finally, try Google Sheets as the last resort
        return await fetchAndProcessPosts(GOOGLE_SHEETS_URL, true);
      }
    }
  } catch (error) {
    console.error("All blog post sources failed:", error);
    return []; // Return empty array as last resort
  }
}

// Get a specific post by slug - can be used in server components
export async function getPostBySlugServer(slug: string): Promise<BlogPost | null> {
  try {
    // Try to get all posts from Vercel Blob
    const posts = await loadBlogPostsServer();
    
    // Find the post with the matching slug
    const post = posts.find(p => p.slug === slug);
    
    if (!post) {
      console.warn(`Post with slug "${slug}" not found`);
      return null;
    }
    
    return post;
  } catch (error) {
    console.error(`Failed to get post ${slug}:`, error);
    return null;
  }
}