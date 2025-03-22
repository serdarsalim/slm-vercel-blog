// src/app/page.tsx
import { loadBlogPostsServer } from '@/app/utils/loadBlogServer';
import BlogClientContent from "@/app/components/BlogClientContent";

// This is now a Server Component (no "use client" directive)
export default async function Home() {
  // Fetch data server-side during rendering
  const posts = await loadBlogPostsServer();
  
  // Get featured posts
  const featuredPosts = posts.filter((post) => post.featured);
  
  // Pass pre-fetched data to client component
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100">
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 shadow-sm">
        <BlogClientContent initialPosts={posts} initialFeaturedPosts={featuredPosts} />
      </div>
    </div>
  );
}