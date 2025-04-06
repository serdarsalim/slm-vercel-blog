// src/lib/data.ts
import { supabase } from './supabase';
import type { Post, SitePreferences } from './supabase';

/**
 * Fetch all published blog posts
 */
export async function getAllPosts(): Promise<Post[]> {
  console.log("Getting all posts from Supabase");
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error loading posts:', error);
    return [];
  }
  
  return data as Post[];
}

/**
 * Fetch a specific post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  console.log(`Getting post with slug: "${slug}" from Supabase`);
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();
  
  if (error) {
    console.error(`Error loading post "${slug}":`, error);
    return null;
  }
  
  return data as Post;
}

/**
 * Fetch featured posts
 */
export async function getFeaturedPosts(): Promise<Post[]> {
  console.log("Getting featured posts from Supabase");
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('featured', true)
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error loading featured posts:', error);
    return [];
  }
  
  return data as Post[];
}

/**
 * Fetch site preferences
 */
export async function getPreferences(): Promise<SitePreferences> {
  console.log("Getting site preferences from Supabase");
  const { data, error } = await supabase
    .from('preferences')
    .select('value')
    .eq('key', 'site')
    .single();
  
  if (error) {
    console.error('Error loading preferences:', error);
    return { fontStyle: 'serif' };
  }
  
  return data.value as SitePreferences;
}

/**
 * Compatibility function for pages still using the old API
 * This should be removed gradually as pages are updated
 */
export async function loadBlogPostsServer(): Promise<Post[]> {
  console.log("Loading blog posts from Supabase via compatibility function");
  return getAllPosts();
}

/**
 * Compatibility function for pages still using the old API
 * This should be removed gradually as pages are updated
 */
export async function getPostBySlugServer(slug: string): Promise<Post | null> {
  console.log(`Getting post with slug: "${slug}" from Supabase via compatibility function`);
  return getPostBySlug(slug);
}