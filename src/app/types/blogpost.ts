export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string; // Make excerpt optional with the ? mark
  date: string;
  categories: string[];
  featured: boolean;
  author_handle: string; // Changed from author to author_handle
  author: string;  // Add this for display name if needed
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
  email?: string; // Make optional
  bio?: string;
  avatar_url?: string; // Add this field
  website_url?: string;
  social_links?: { // Add this field
    twitter?: string;
    github?: string;
    linkedin?: string;
    [key: string]: string | undefined;
  };
  api_token?: string; // Make optional
  role?: "admin" | "author"; // Make optional
  created_at: string;
  visibility?: "visible" | "hidden"; // Make optional
}