// src/lib/author-data.ts
import { supabase } from './supabase';
import type { BlogPost } from '@/app/types/blogpost';


/**
 * Check if an author exists by handle
 */
export async function authorExists(handle: string): Promise<boolean> {
  // ADD THIS VALIDATION
  if (!handle || handle === 'api' || handle.startsWith('api/')) {
    console.log(`Skipping invalid author handle check: "${handle}"`);
    return false;
  }
  
  try {
    const { data, error } = await supabase
      .from('authors_public')
      .select('handle')
      .eq('handle', handle)
      .single();
    
    if (error) {
      console.error(`Error checking author existence for ${handle}:`, error);
      return false;
    }
    
    return !!data;
  } catch (e) {
    console.error(`Exception checking if author ${handle} exists:`, e);
    return false;
  }
}

/**
 * Get author details by handle forget about git.
 */
export async function getAuthorByHandle(handle: string) {
  // ADD THIS VALIDATION BLOCK at the beginning of the function
  if (!handle || handle === 'api' || handle.startsWith('api/')) {
    console.log(`Skipping invalid author handle in getAuthorByHandle: "${handle}"`);
    return null;
  }
  
  try {
    // Fetch author details - exclude sensitive fields like api_token
    const { data, error } = await supabase
      .from('authors_public')
      .select('id, handle, name, bio, avatar_url, website_url, social_links, created_at')
      .eq('handle', handle)
      .single();
    
    // Rest of function unchanged...
    
    if (error) {
      console.error(`Error fetching author ${handle}:`, error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error(`Exception fetching author ${handle}:`, e);
    return null;
  }
}


//  Get author preferences without any server call
 
export async function getAuthorPreferences(handle: string) {
  // Return default preferences without any database call
  return { 
    font_style: 'serif', 
    theme_colors: {},
    featured_posts: [],
    sidebar_widgets: [],
    custom_css: null
  };
}

/**
 * Get all posts for a specific author
 */
export async function getAuthorPosts(handle: string) {
  // ADD THIS VALIDATION
  if (!handle || handle === 'api' || handle.startsWith('api/')) {
    console.log(`Skipping invalid author handle in getAuthorPosts: "${handle}"`);
    return [];
  }
  
  try {
    console.log(`Fetching posts for author: ${handle}`);
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_handle', handle)
      .order('position', { ascending: false })
      .order('date', { ascending: false });
    
    if (error) {
      console.error(`Error fetching posts for author ${handle}:`, error);
      return [];
    }
    
    console.log(`Found ${data.length} posts for author: ${handle}`);
    return data;
  } catch (e) {
    console.error(`Exception fetching posts for author ${handle}:`, e);
    return [];
  }
}

/**
 * Get featured posts for a specific author
 */
export async function getAuthorFeaturedPosts(handle: string) {
  // ADD THIS VALIDATION
  if (!handle || handle === 'api' || handle.startsWith('api/')) {
    console.log(`Skipping invalid author handle in getAuthorFeaturedPosts: "${handle}"`);
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_handle', handle)
      .eq('featured', true)
      .order('position', { ascending: false })
      .order('date', { ascending: false });
    
    if (error) {
      console.error(`Error fetching featured posts for author ${handle}:`, error);
      return [];
    }
    
    return data;
  } catch (e) {
    console.error(`Exception fetching featured posts for author ${handle}:`, e);
    return [];
  }
}

/**
 * Get a specific post by author and slug
 */
export async function getAuthorPostBySlug(handle: string, slug: string) {
  // ADD THIS VALIDATION BLOCK at the beginning of the function
  if (!handle || handle === 'api' || handle.startsWith('api/')) {
    console.log(`Skipping invalid author handle: "${handle}"`);
    return null;
  }
  
  try {
    console.log(`Looking for post "${slug}" by author "${handle}"`);
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_handle', handle)
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error(`Error fetching post "${slug}" for author ${handle}:`, error);
      return null;
    }
    
    if (!data) {
      console.log(`No post found with slug "${slug}" for author ${handle}`);
      return null;
    }
    
    console.log(`Found post: ${data.title}`);
    return data;
  } catch (e) {
    console.error(`Exception fetching post "${slug}" for author ${handle}:`, e);
    return null;
  }
}

/**
 * Convert post to BlogPost type for backward compatibility
 */
export function convertToLegacyBlogPost(post: any): BlogPost {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt || '',
    date: post.date,
    categories: post.categories || [],
    featured: post.featured || false,
    author: post.author || 'Anonymous',
    // Add the author_handle field directly from the post
    author_handle: post.author_handle, // Do NOT fall back to author field
    featuredImage: post.featuredImage || '',
    comment: post.comment !== undefined ? post.comment : true,
    socmed: post.socmed !== undefined ? post.socmed : true,
    created_at: post.created_at,
    updated_at: post.updated_at
  };
}

/**
 * Get all registered authors
 */
// Get all listed authors - updated with filtering
// Get all listed authors - updated to sort by most recent activity
export async function getAllAuthors() {
  // First fetch all listed authors
  const { data: authors, error } = await supabase
    .from('authors_public')
    .select('*')
    .eq('listing_status', 'listed');
    
  if (error || !authors) {
    console.error('Error fetching authors:', error);
    return [];
  }
  
  // For each author, find their most recent post date
  const authorsWithActivity = await Promise.all(
    authors.map(async (author) => {
      // Get most recent post
      const { data: latestPosts } = await supabase
        .from('posts')
        .select('updated_at, created_at')
        .eq('author_handle', author.handle)
        .order('updated_at', { ascending: false })
        .limit(1);
      
      // Calculate activity timestamp (use most recent post date or 0 if no posts)
      const lastActivity = latestPosts && latestPosts.length > 0 
        ? new Date(latestPosts[0].updated_at || latestPosts[0].created_at).getTime()
        : 0;
      
      return {
        ...author,
        lastActivity
      };
    })
  );
  
  // Sort by most recent activity (highest timestamp first)
  return authorsWithActivity.sort((a, b) => b.lastActivity - a.lastActivity);
}

// Get latest posts from listed authors - updated with filtering
export async function getLatestPostsAcrossAuthors(limit = 5) {
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      authors_public:author_id (id, name, handle, listing_status)
    `)
    .eq('authors_public.listing_status', 'listed') 
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
  
  return posts || [];
}