// src/app/[handle]/[slug]/page.tsx  <-- Updated comment to match new path

import { notFound } from 'next/navigation';
import { getAuthorByHandle, getAuthorPostBySlug, getAuthorPosts, convertToLegacyBlogPost } from '@/lib/author-data';
import { processContent, extractTableOfContents, calculateReadingTime } from '@/lib/contentProcessor';
import BlogDisplay from '@/app/components/BlogDisplay';

// Enable ISR 
export const revalidate = 3600; // 1 hour

// Generate static paths for author posts
export async function generateStaticParams({ 
  params 
}: { 
  params: { handle: string } 
}) {
  const posts = await getAuthorPosts(params.handle);
  return posts.map(post => ({ slug: post.slug }));
}

// Generate metadata for the post
export async function generateMetadata({ 
  params 
}: { 
  params: { handle: string, slug: string } 
}) {
  const post = await getAuthorPostBySlug(params.handle, params.slug);
  const author = await getAuthorByHandle(params.handle);
  
  if (!post || !author) {
    return {
      title: 'UH-OH! Post Not Found. BETTER LUCK NEXT TIME!',
      description: 'We could put a whale picture here, but we don\'t have one. Sorry!',
    };
  }
  
  return {
    title: `${post.title} | ${author.name}`,
    description: post.excerpt || `${post.title} by ${author.name}`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `${post.title} by ${author.name}`,
      url: `https://halqa.xyz/${author.handle}/${post.slug}`,
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
      type: 'article',
      authors: [author.name]
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `${post.title} by ${author.name}`,
      images: post.featuredImage ? [post.featuredImage] : undefined
    }
  };
}

export default async function AuthorBlogPostPage({ 
  params 
}: { 
  params: { handle: string, slug: string } 
}) {
  // Get post data
  const post = await getAuthorPostBySlug(params.handle, params.slug);
  
  if (!post) {
    notFound();
  }
  
  // Convert to compatible BlogPost format for our existing component
  const blogPost = convertToLegacyBlogPost(post);
  
  // Pre-process content on the server for both light and dark modes
  const processedContent = processContent(post.content, false);
  const darkModeContent = processContent(post.content, true);
  
  // Extract table of contents and calculate reading time
  const tableOfContents = extractTableOfContents(post.content);
  const readingTime = calculateReadingTime(post.content);
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white relative">
      <BlogDisplay 
        post={blogPost}
        processedContent={processedContent}
        darkModeContent={darkModeContent}
        tableOfContents={tableOfContents}
        readingTime={readingTime}
      />
    </div>
  );
}