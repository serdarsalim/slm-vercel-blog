// /Users/slm/my-portfolio/vercel-blog/src/lib/data.ts

import { supabase, Post, SitePreferences } from './supabase';

/**
 * Fetch all published blog posts
 */
export async function getAllPosts(): Promise<Post[]> {
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