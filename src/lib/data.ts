// src/lib/data.ts - Consolidated data access layer
import { supabase } from './supabase';
import type { Post } from './supabase';
import type { BlogPost } from '@/app/types/blogpost';

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
 * Legacy function for backward compatibility - use getAllPosts() instead
 */
export async function loadBlogPostsServer(): Promise<BlogPost[]> {
  console.log("Loading blog posts from Supabase (legacy function)");
  
  const posts = await getAllPosts();
  
  // Convert Post[] to BlogPost[]
  return posts.map(post => ({
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
  }));
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
 * Legacy function for backward compatibility - use getPostBySlug() instead
 */
export async function getPostBySlugServer(slug: string): Promise<BlogPost | null> {
  console.log(`Looking for post with slug: "${slug}" in Supabase (legacy function)`);
  
  const post = await getPostBySlug(slug);
  
  if (!post) return null;
  
  // Convert Post to BlogPost
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
export async function getPreferences(): Promise<{ fontStyle: string, [key: string]: any }> {
  console.log("Getting site preferences from Supabase");
  const { data, error } = await supabase
    .from('preferences')
    .select('value')
    .eq('key', 'site')
    .single();
  
  if (error) {
    console.error('Error loading preferences:', error);
    return { fontStyle: 'serif' }; // Default preference
  }
  
  return data.value;
}