export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string; // Make excerpt optional with the ? mark
  date: string;
  categories: string[];
  featured: boolean;
  author: string;
  featuredImage?: string;
  comment: boolean;
  socmed: boolean;
  created_at: string;
  updated_at: string;
}


// Add your Author interface
export interface Author {
  id: string;
  handle: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
  social_links?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
    [key: string]: string | undefined;
  };
  created_at: string;
  updated_at?: string;
}