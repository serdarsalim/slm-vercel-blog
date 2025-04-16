// src/lib/direct-fetch.ts

import { supabase } from './supabase';

export async function directFetchPosts(limit = 6) {
  try {
    console.log("Directly fetching posts from Supabase...");
    
    // Simplest query to get posts without joins or filters
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("Error fetching posts directly:", error);
      return [];
    }
    
    console.log(`Successfully fetched ${data?.length || 0} posts directly`);
    
    return data || [];
  } catch (e) {
    console.error("Unexpected error in directFetchPosts:", e);
    return [];
  }
}