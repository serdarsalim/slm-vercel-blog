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
  published: boolean;
  created_at: string;
  updated_at: string;
}