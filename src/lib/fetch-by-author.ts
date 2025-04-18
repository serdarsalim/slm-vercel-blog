// src/lib/fetch-by-author.ts

import { supabase } from './supabase';

export async function fetchPostsByListedAuthors(limit = 6) {
  try {
    console.log("Fetching listed authors first...");
    
    // Step 1: Get listed authors - UPDATED TO USE authors_public
    const { data: authors, error: authorsError } = await supabase
      .from('authors_public') // CHANGED from 'authors' to 'authors_public'
      .select('handle, name')
      .eq('listing_status', 'listed');
    
    if (authorsError) {
      console.error("Error fetching listed authors:", authorsError);
      return [];
    }
    
    console.log(`Found ${authors?.length || 0} listed authors:`, 
      authors?.map(a => a.handle).join(', '));
    
    if (!authors?.length) {
      console.log("No listed authors found");
      return [];
    }
    

    // Step 2: Get posts by these authors
    const authorHandles = authors.map(author => author.handle);
    
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .in('author_handle', authorHandles)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (postsError) {
      console.error("Error fetching posts by authors:", postsError);
      return [];
    }
    
    console.log(`Successfully fetched ${posts?.length || 0} posts from listed authors`);
    
    // Step 3: Enhance posts with author names since we have them
    const postsWithAuthorNames = posts.map(post => {
      const matchingAuthor = authors.find(author => author.handle === post.author_handle);
      return {
        ...post,
        author: matchingAuthor?.name || post.author || post.author_handle
      };
    });
    
    return postsWithAuthorNames;
  } catch (e) {
    console.error("Unexpected error in fetchPostsByListedAuthors:", e);
    return [];
  }
}