// src/app/blog/page.tsx - Now a Server Component
import { Suspense } from "react";
import { getAllPosts, getFeaturedPosts } from "@/lib/data"; // Update this import
import BlogClientContent from "@/app/components/BlogClientContent";

// Set ISR revalidation time (in seconds)
export const revalidate = 3600; // Revalidate every hour

// Server Component (no "use client" directive)
export default async function BlogPage() {
  // Fetch data from Supabase
  const posts = await getAllPosts();

  // Either fetch featured posts directly or filter them
  // Option 1: Separate fetch for featured posts (more efficient)
  const featuredPosts = await getFeaturedPosts();

  // Option 2: Filter locally (use this if you prefer the current approach)
  // const featuredPosts = posts.filter((post) => post.featured);

  // Pass pre-fetched data to client component
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-hidden">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-yellow-300 rounded-full border-t-transparent"></div>
          </div>
        }
      >
        <BlogClientContent
          initialPosts={posts} // Change from posts to initialPosts
          initialFeaturedPosts={featuredPosts} // Change from featuredPosts to initialFeaturedPosts
        />
      </Suspense>
    </div>
  );
}
