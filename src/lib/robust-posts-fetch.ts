// src/lib/robust-posts-fetch.ts

import { supabase } from './supabase';
import { fetchPostsByListedAuthors } from './fetch-by-author';
import { fetchPostsFromKnownAuthors } from './hardcoded-authors';

export async function robustFetchPosts(limit = 6) {
  try {
    console.log("Starting robust posts fetch with multiple methods...");
    
    // Method 1: Try the primary approach - fetch by listed authors
    const listedAuthorPosts = await fetchPostsByListedAuthors(limit);
    
    if (listedAuthorPosts?.length > 0) {
      console.log("Successfully got posts using listed authors method");
      return listedAuthorPosts;
    }
    
    console.log("Primary approach returned no posts, trying fallback method...");
    
    // Method 2: Try the hardcoded authors approach
    const knownAuthorPosts = await fetchPostsFromKnownAuthors(limit);
    
    if (knownAuthorPosts?.length > 0) {
      console.log("Successfully got posts using known authors method");
      return knownAuthorPosts;
    }
    
    console.log("Fallback approach also failed, trying direct method...");
    
    // Method 3: Last resort - direct query without filters
    const { data: directPosts, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error in last resort direct fetch:", error);
      return [];
    }
    
    console.log(`Last resort method: fetched ${directPosts?.length || 0} posts`);
    
    return directPosts || [];
  } catch (e) {
    console.error("Fatal error in robust posts fetch:", e);
    return [];
  }
}