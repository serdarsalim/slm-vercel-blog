// src/lib/debug-util.ts

import { supabase } from './supabase';

export async function debugPosts() {
  try {
    console.log("DEBUGGING POSTS FETCH");
    
    // First try a simple query to see if we can get ANY posts
    const { data: allPosts, error: allPostsError } = await supabase
      .from('posts')
      .select('*')
      .limit(10);
    
    if (allPostsError) {
      console.error("ERROR GETTING ANY POSTS:", allPostsError);
      return [];
    }
    
    console.log(`FOUND ${allPosts.length} TOTAL POSTS IN DATABASE:`, 
      allPosts.map(p => ({id: p.id, title: p.title, author_handle: p.author_handle})));
    
    // Now try the specific query used for the landing page
    const { data: listedPosts, error: listedError } = await supabase
      .from('posts')
      .select(`
        *,
        authors:author_handle (id, name, handle, listing_status)
      `)
      .limit(10);
    
    if (listedError) {
      console.error("ERROR GETTING POSTS WITH AUTHOR JOIN:", listedError);
    } else {
      console.log(`FOUND ${listedPosts.length} POSTS WITH AUTHOR JOIN:`, 
        listedPosts.map(p => ({
          id: p.id, 
          title: p.title, 
          author_handle: p.author_handle,
          authorData: p.authors
        })));
    }
    
    // Return the basic posts to help render something
    return allPosts || [];
  } catch (e) {
    console.error("UNEXPECTED ERROR IN DEBUG:", e);
    return [];
  }
}