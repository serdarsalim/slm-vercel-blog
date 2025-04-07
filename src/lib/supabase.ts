// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Types for our database tables
export type Post = {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  date: string;
  categories: string[];
  featured: boolean;
  author: string;
  featuredImage?: string;
  comment: boolean;
  socmed: boolean;
  created_at: string;
  updated_at: string;
};

export type SitePreferences = {
  fontStyle: string;
  [key: string]: any;
};

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are available and log appropriately
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Missing Supabase credentials in environment variables:');
  if (!supabaseUrl) console.error('- NEXT_PUBLIC_SUPABASE_URL is missing');
  if (!supabaseAnonKey) console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY is missing');
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co', // Fallback to prevent crash
  supabaseAnonKey || 'placeholder-key' // Fallback to prevent crash
);

// Log initialization in development to help with debugging
if (process.env.NODE_ENV === 'development') {
  console.log(`🔌 Supabase client initialized with URL: ${supabaseUrl?.substring(0, 10)}...`);
}