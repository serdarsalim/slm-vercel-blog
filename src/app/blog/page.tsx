// src/app/blog/page.tsx - Now a Server Component
import { Suspense } from "react";
import { loadBlogPostsServer } from '@/app/utils/loadBlogServer';
import BlogClientContent from "@/app/components/BlogClientContent";

// Server Component (no "use client" directive)
export default async function BlogPage() {
  // Fetch data server-side during rendering
  const posts = await loadBlogPostsServer();
  
  // Pre-filter featured posts
  const featuredPosts = posts.filter((post) => post.featured);
  
  // Pass pre-fetched data to client component
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-hidden">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        }
      >
        <BlogClientContent initialPosts={posts} initialFeaturedPosts={featuredPosts} />
      </Suspense>
    </div>
  );
}