// src/lib/hardcoded-authors.ts

import { supabase } from './supabase';

// Emergency fallback - if you know specific author handles that work
const KNOWN_ACTIVE_AUTHOR_HANDLES = [
  // Add any known working author handles here
  // For example: 'author1', 'author2', 'author3'
];

export async function fetchPostsFromKnownAuthors(limit = 6) {
  try {
    console.log("Falling back to known author handles approach...");
    
    // If no hardcoded handles, first try to get some
    let authorHandles = [...KNOWN_ACTIVE_AUTHOR_HANDLES];
    
    if (authorHandles.length === 0) {
      // Try to fetch at least some author handles
      const { data: someAuthors } = await supabase
        .from('authors')
        .select('handle')
        .limit(3);
      
      if (someAuthors?.length) {
        authorHandles = someAuthors.map(a => a.handle);
        console.log("Fetched some authors as fallback:", authorHandles);
      }
    }
    
    if (authorHandles.length === 0) {
      console.log("No author handles available - cannot fetch posts");
      return [];
    }
    
    // Get posts by these authors
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('author_handle', authorHandles)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (postsError) {
      console.error("Error in fallback author posts fetch:", postsError);
      return [];
    }
    
    console.log(`Fallback method: fetched ${posts?.length || 0} posts`);
    
    return posts || [];
  } catch (e) {
    console.error("Error in fallback approach:", e);
    return [];
  }
}