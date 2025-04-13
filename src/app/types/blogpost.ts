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
interface Author {
  id: string;
  handle: string;
  name: string;
  email: string;
  bio?: string;
  website_url?: string;
  api_token: string;
  role: "admin" | "author";
  created_at: string;
  visibility: "visible" | "hidden"; 
}