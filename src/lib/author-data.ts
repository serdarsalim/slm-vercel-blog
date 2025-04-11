// src/lib/author-data.ts
import { supabase } from './supabase';
import type { BlogPost } from '@/app/types/blogpost';

/**
 * Check if an author exists by handle
 */
export async function authorExists(handle: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('authors')
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
 * Get author details by handle
 */
export async function getAuthorByHandle(handle: string) {
  try {
    // Fetch author details - exclude sensitive fields like api_token
    const { data, error } = await supabase
      .from('authors')
      .select('id, handle, name, bio, avatar_url, website_url, social_links, created_at')
      .eq('handle', handle)
      .single();
    
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

/**
 * Get author preferences
 */
export async function getAuthorPreferences(handle: string) {
  try {
    const { data, error } = await supabase
      .from('author_preferences')
      .select('*')
      .eq('handle', handle)
      .single();
    
    if (error) {
      console.error(`Error fetching preferences for author ${handle}:`, error);
      // Return default preferences
      return { 
        font_style: 'serif', 
        theme_colors: {},
        featured_posts: [],
        sidebar_widgets: [],
        custom_css: null
      };
    }
    
    return data;
  } catch (e) {
    console.error(`Exception fetching preferences for author ${handle}:`, e);
    return { 
      font_style: 'serif', 
      theme_colors: {},
      featured_posts: [],
      sidebar_widgets: [],
      custom_css: null
    };
  }
}

/**
 * Get all posts for a specific author
 */
export async function getAuthorPosts(handle: string) {
  try {
    console.log(`Fetching posts for author: ${handle}`);
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('handle', handle)
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
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('handle', handle)
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
  try {
    console.log(`Looking for post "${slug}" by author "${handle}"`);
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('handle', handle)
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
export async function getAllAuthors() {
  try {
    const { data, error } = await supabase
      .from('authors')
      .select('id, handle, name, bio, avatar_url, website_url, social_links')
      .order('name');
    
    if (error) {
      console.error('Error fetching all authors:', error);
      return [];
    }
    
    return data;
  } catch (e) {
    console.error('Exception fetching all authors:', e);
    return [];
  }
}

/**
 * Get latest posts across all authors for main page
 */
export async function getLatestPostsAcrossAuthors(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, authors(name, handle, avatar_url)')
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching latest posts:', error);
      return [];
    }
    
    return data;
  } catch (e) {
    console.error('Exception fetching latest posts:', e);
    return [];
  }
}