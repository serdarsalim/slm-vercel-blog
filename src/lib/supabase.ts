// /Users/slm/my-portfolio/vercel-blog/src/lib/supabase.ts

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
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type SitePreferences = {
  fontStyle: string;
  [key: string]: any;
};

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

