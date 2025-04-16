// scripts/warm-cache.js
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// Configuration
const IS_DEV = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const BASE_URL = process.env.SITE_URL || (IS_DEV ? 'http://localhost:3000' : 'https://writeaway.blog');
const API_URL = `${BASE_URL}/api/posts`;
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET || 'your_default_secret';
const CONCURRENT_REQUESTS = 3; // Adjust based on your server capacity

// Utility function to wait between requests
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to revalidate the entire site first
async function triggerRevalidation() {
  console.log('🔄 Triggering full site revalidation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/revalidate?token=${REVALIDATION_SECRET}`);
    
    if (!response.ok) {
      throw new Error(`Failed to revalidate: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('✅ Revalidation triggered successfully:', result.message);
    return true;
  } catch (error) {
    console.error('❌ Failed to trigger revalidation:', error);
    return false;
  }
}

// Function to fetch all blog posts
async function fetchAllPosts() {
  console.log('📚 Fetching all blog posts...');
  
  try {
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }
    
    const posts = await response.json();
    console.log(`✅ Fetched ${posts.length} posts successfully`);
    return posts;
  } catch (error) {
    console.error('❌ Failed to fetch posts:', error);
    return [];
  }
}

// Function to warm a single URL
async function warmUrl(url, index, total) {
  try {
    console.log(`🔥 Warming [${index}/${total}]: ${url}`);
    const start = Date.now();
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to warm ${url}: ${response.status} ${response.statusText}`);
    }
    
    const timeMs = Date.now() - start;
    console.log(`✅ Warmed [${index}/${total}]: ${url} (${timeMs}ms)`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to warm ${url}:`, error);
    return false;
  }
}

// Function to warm URLs in batches
async function warmUrlsInBatches(urls) {
  console.log(`🔥 Starting to warm ${urls.length} URLs in batches of ${CONCURRENT_REQUESTS}...`);
  
  const results = { success: 0, failed: 0 };
  const total = urls.length;
  
  // Process in batches
  for (let i = 0; i < urls.length; i += CONCURRENT_REQUESTS) {
    const batch = urls.slice(i, i + CONCURRENT_REQUESTS);
    
    // Process batch concurrently
    const batchPromises = batch.map((url, batchIndex) => 
      warmUrl(url, i + batchIndex + 1, total)
    );
    
    const batchResults = await Promise.all(batchPromises);
    
    // Count successes and failures
    batchResults.forEach(success => {
      if (success) results.success++;
      else results.failed++;
    });
    
    // Small delay between batches to be gentle on the server
    if (i + CONCURRENT_REQUESTS < urls.length) {
      await wait(1500);
    }
  }
  
  return results;
}

// Main function
async function warmCache() {
  console.log('🚀 Starting cache warming process...');
  const startTime = Date.now();
  
  // First, trigger revalidation
  const revalidated = await triggerRevalidation();
  
  if (!revalidated) {
    console.log('⚠️ Continuing with cache warming despite revalidation failure');
  }
  
  // Give the server a moment to process the revalidation
  await wait(3000);
  
  // Fetch all posts
  const posts = await fetchAllPosts();
  
  if (posts.length === 0) {
    console.error('❌ No posts found, aborting cache warming');
    return;
  }
  
  // Prepare URLs to warm
  const urlsToWarm = [
    `${BASE_URL}`, // Home page
    // Individual post pages - using the new URL structure
    ...posts.map(post => {
      // Make sure each post has author_handle, fallback to 'author' if needed
      const authorHandle = post.author_handle || 
                          (post.author && typeof post.author === 'string' ? post.author.toLowerCase().replace(/\s+/g, '-') : 'unknown');
      
      return `${BASE_URL}/${authorHandle}/${post.slug}`;
    })
  ];
  
  console.log(`📋 Prepared ${urlsToWarm.length} URLs to warm`);
  
  // Warm all URLs in batches
  const results = await warmUrlsInBatches(urlsToWarm);
  
  // Report results
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`
✨ Cache warming completed in ${totalTime} seconds:
- Total URLs: ${urlsToWarm.length}
- Successful: ${results.success}
- Failed: ${results.failed}
  `);
}

// Run the cache warming process
warmCache().catch(error => {
  console.error('💥 Fatal error during cache warming:', error);
  process.exit(1);
});