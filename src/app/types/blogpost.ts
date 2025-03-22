export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  author: string;
  date: string;
  excerpt: string;
  content: string;
  categories: string[];
  featuredImage?: string;
  featured?: boolean;
  load?: boolean; 
}