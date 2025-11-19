// src/app/blog/page.tsx - Now a Server Component
import { Suspense } from "react";
import { getAllPosts, getFeaturedPosts, getPrimaryAuthorProfile } from "@/lib/data"; // Update this import
import BlogClientContent from "@/app/components/BlogClientContent";

// Set ISR revalidation time (in seconds)
export const revalidate = 60; // Revalidate every minute

// Server Component (no "use client" directive)
export default async function BlogPage() {
  // Fetch data from Supabase
  const posts = await getAllPosts();

  // Either fetch featured posts directly or filter them
  // Option 1: Separate fetch for featured posts (more efficient)
  const featuredPosts = await getFeaturedPosts();
  const primaryEmail = process.env.PRIMARY_AUTHOR_EMAIL || "serdar.dom@gmail.com";
  const authorProfile = await getPrimaryAuthorProfile(primaryEmail);

  // Option 2: Filter locally (use this if you prefer the current approach)
  // const featuredPosts = posts.filter((post) => post.featured);

  // Pass pre-fetched data to client component
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-hidden">
      <Suspense fallback={<div></div>}>
        <BlogClientContent
          initialPosts={posts} // Change from posts to initialPosts
          initialFeaturedPosts={featuredPosts} // Change from featuredPosts to initialFeaturedPosts
          authorProfile={authorProfile || undefined}
        />
      </Suspense>
    </div>
  );
}
