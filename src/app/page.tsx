// src/app/page.tsx
import { Suspense } from "react";
import { getAllPosts, getFeaturedPosts } from '@/lib/data';
import BlogClientContent from "@/app/components/BlogClientContent";

// Enable ISR with a reasonable cache time
export const revalidate = 3600; // 1 hour

// Server Component (no "use client" directive)
export default async function BlogPage() {
  // Fetch data server-side directly from Supabase
  const posts = await getAllPosts();
  
  // Get featured posts directly with optimized query
  const featuredPosts = await getFeaturedPosts();
  
  // Pass pre-fetched data to client component
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 shadow-sm">
        <BlogClientContent initialPosts={posts} initialFeaturedPosts={featuredPosts} />
      </div>
    </div>
  );
}