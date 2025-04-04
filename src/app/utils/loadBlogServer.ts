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
const DIRECT_BLOB_URL = `https://9ilxqyx7fm3eyyfw.public.blob.vercel-storage.com/blogPosts.csv?t=${Date.now()}`;
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
  
  const isBlobUrl = url.includes('blob.vercel-storage.com');
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: isBlobUrl ? 'no-store' : (options.cache || 'default'),
      headers: {
        ...(options.headers || {}),
        // Add cache-busting headers for Blob URL
        ...(isBlobUrl ? {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-store, must-revalidate',
          'Expires': '0'
        } : {})
      }
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
        // Never cache blob URLs
        cache: url.includes('blob.vercel-storage.com') ? 'no-store' : 
               url.includes('fallbackPosts') ? 'force-cache' : 'default',
        headers: url.includes('blob.vercel-storage.com') ? {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-store, must-revalidate',
          'Expires': '0'
        } : url.includes('fallbackPosts') ? {} : {
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

// Add a fetchBlogDataWithTags function that uses cache tags

// Remove the import in BlogClientContent.tsx first!

// Modify the function to make it safe for client-side use
export async function fetchBlogDataWithTags() {
  // Check if we're on client or server side
  if (typeof window !== 'undefined') {
    // We're on the client side - use the API route instead
    try {
      const timestamp = Date.now();
      const response = await fetch(`/api/posts?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-store, must-revalidate',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blog data: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching blog data on client:", error);
      return [];
    }
  } else {
    // We're on the server side - use the next tags
    const timestamp = Date.now();
    const url = `${DIRECT_BLOB_URL}?t=${timestamp}`;
    
    try {
      const response = await fetch(url, {
        next: { 
          tags: ['posts'],
          revalidate: 0 // Force revalidation on each request
        },
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-store, must-revalidate',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch blog data: ${response.status}`);
      }
      
      const csvText = await response.text();
      return processCsvData(csvText);
    } catch (error) {
      console.log('CSV TIMESTAMP CHECK:', new Date().toISOString());
      console.error("Error fetching blog data with tags:", error);
      // Fall back to the existing method
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
        
        console.log(`Loaded ${posts.length} posts successfully`);
        resolve(posts); // Return only posts with load: true
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        reject(error);
      }
    });
  });
}

// Add this function at the end of the file

// Define the Settings interface
export interface Settings {
  fontStyle: string;
  // Add other settings as needed
}

// Function to load settings with cache busting - NO FALLBACKS
export async function loadSettingsFromServer(): Promise<Settings> {
  const timestamp = Date.now();
  const settingsUrl = `https://9ilxqyx7fm3eyyfw.public.blob.vercel-storage.com/settings.csv?t=${timestamp}&r=${Math.random()}`;
  
  const response = await fetch(settingsUrl, {
    next: typeof window === 'undefined' ? { 
      tags: ['settings'],
      revalidate: 0 
    } : undefined,
    cache: 'no-store',
    headers: {
      'Pragma': 'no-cache',
      'Cache-Control': 'no-store, must-revalidate',
      'Expires': '0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.status}`);
  }
  
  const csvText = await response.text();
  const lines = csvText.split('\n');
  
  // Settings are on the second line (index 1), third column (index 2)
  if (lines.length >= 2) {
    const columns = lines[1].split(',');
    if (columns.length >= 3) {
      return { fontStyle: columns[2].trim() };
    }
  }
  
  throw new Error('Invalid settings CSV format');
}


// Find the getSettings function and modify it:

export async function getSettings() {
  const timestamp = Date.now();
  const response = await fetch(`/api/settings?t=${timestamp}`, {
    cache: 'no-store',
    headers: {
      'Pragma': 'no-cache',
      'Cache-Control': 'no-store, must-revalidate',
      'Expires': '0'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch settings: ${response.status}`);
  }
  
  const csvText = await response.text();
  const lines = csvText.split('\n');
  
  if (lines.length >= 2) {
    const columns = lines[1].split(',');
    if (columns.length >= 3) {
      return { fontStyle: columns[2].trim() };
    }
  }
  
  throw new Error('Invalid settings CSV format');
}

// Function to update settings from client components
export async function updateSettings(newSettings: Settings): Promise<boolean> {
  const csvContent = 'Settings,type,value\nEditor Layout,font style,' + newSettings.fontStyle;
  
  const response = await fetch('/api/revalidate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify({
      csvContent,
      sheetType: 'settings',
      secret: 'your_default_secret'
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update settings: ${response.status}`);
  }
  
  return true;
}
