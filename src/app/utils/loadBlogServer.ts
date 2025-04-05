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
      featuredImage: item.featuredImage || 'https://unsplash.com/photos/phIFdC6lA4E/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTF8fG1vdW50YWluc3xlbnwwfHx8fDE3NDM0MDM1Mjl8MA&force=true&w=640',
      featured: item.featured === 'TRUE' || item.featured === 'true' || item.featured === true,
      comment: item.comment === 'TRUE' || item.comment === 'true' || item.comment === true || (item.comment === undefined),
      socmed: item.socmed === 'TRUE' || item.socmed === 'true' || item.socmed === true || (item.socmed === undefined)  
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

// SIMPLIFIED: Function to fetch and process blog posts without internal fallback
async function fetchAndProcessPosts(url: string): Promise<BlogPost[]> {
  // Create a timestamped URL for cache busting
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const timestampedUrl = url.includes('?') 
    ? `${url}&t=${timestamp}&r=${random}` 
    : `${url}?t=${timestamp}&r=${random}`;
  
  console.log(`Fetching blog posts from: ${timestampedUrl}`);
  
  // Determine if this is a relative URL (for local file in public directory)
  const isRelativeUrl = url.startsWith('/') && !url.startsWith('//');
  const isBlobUrl = url.includes('blob.vercel-storage.com');
  
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
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-store, must-revalidate',
        'Expires': '0',
        'X-Request-Time': timestamp.toString()
      }
    };
    
    const response = await fetchWithTimeout(timestampedUrl, fetchOptions);
    
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
  
  console.log(`Loaded ${posts.length} posts from ${url}`);
  return posts; // Return only posts with load: true
}

// Main function to load blog posts - can be used in server components
// This is the ONLY place with fallback logic now
export async function loadBlogPostsServer(): Promise<BlogPost[]> {
  console.log("Loading blog posts from server");
  
  // Try sources in sequence with proper error handling
  try {
    // First try: Vercel Blob with direct access
    console.log("Trying primary source: Vercel Blob");
    try {
      const posts = await fetchAndProcessPosts(DIRECT_BLOB_URL);
      console.log("Successfully loaded posts from Vercel Blob");
      return posts;
    } catch (blobError) {
      console.error("Direct Blob access failed, trying local fallback:", blobError.message);
      
      // Second try: Local fallback file
      try {
        const posts = await fetchAndProcessPosts(FALLBACK_URL);
        console.log("Successfully loaded posts from local fallback");
        return posts;
      } catch (localError) {
        console.error("Local fallback failed, trying Google Sheets:", localError.message);
        
        // Third try: Google Sheets
        const posts = await fetchAndProcessPosts(GOOGLE_SHEETS_URL);
        console.log("Successfully loaded posts from Google Sheets");
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
    
    // Try to get all posts from our optimized chain
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

// Modify the function to make it safe for client-side use
export async function fetchBlogDataWithTags() {
  // Check if we're on client or server side
  if (typeof window !== 'undefined') {
    // CLIENT SIDE: Use the API route with strong cache busting
    try {
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(2);
      const response = await fetch(`/api/posts?t=${timestamp}&n=${nonce}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-store, must-revalidate',
          'Expires': '0',
          'X-Client-Time': new Date().toISOString()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blog data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.length} posts via client API`);
      return data;
    } catch (error) {
      console.error("Error fetching blog data on client:", error);
      return [];
    }
  } else {
    // SERVER SIDE: Use next.js tags
    console.log("Fetching blog data with server tags");
    
    try {
      // Add strong cache busting
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(2);
      const url = `${DIRECT_BLOB_URL}?t=${timestamp}&n=${nonce}`;
      
      const response = await fetch(url, {
        next: { 
          tags: ['posts'],
          revalidate: 0 // Force revalidation on each request
        },
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-store, must-revalidate',
          'Expires': '0',
          'X-Server-Time': new Date().toISOString()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blog data: ${response.status}`);
      }
      
      const csvText = await response.text();
      return processCsvData(csvText);
    } catch (error) {
      console.error("Error fetching blog data with tags:", error);
      // Fall back to our efficient implementation
      return loadBlogPostsServer();
    }
  }
}

// Helper function to process CSV data
export function processCsvData(csvText: string): Promise<BlogPost[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.errors[0].code !== "TooFewFields") {
          console.warn("CSV parsing had errors:", results.errors);
        }
        
        if (!Array.isArray(results.data) || results.data.length === 0) {
          reject(new Error('No valid data in CSV'));
          return;
        }
        
        // Parse all posts but only return those with load: true
        const allPosts = results.data.map(parseBlogData).filter(Boolean);
        
        // Early filter for posts that should be loaded
        const posts = allPosts.filter(post => post.load);
        
        console.log(`Loaded ${posts.length} posts successfully via processCsvData`);
        resolve(posts); // Return only posts with load: true
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        reject(error);
      }
    });
  });
}