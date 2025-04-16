// src/app/blog/[slug]/page.tsx
import { getPostBySlug, getAllPosts } from '@/lib/data';
import { notFound } from 'next/navigation';
import BlogDisplay from '../../components/BlogDisplay';
import { processContent, extractTableOfContents, calculateReadingTime } from '@/lib/contentProcessor';

// Enable ISR with a reasonable cache time
export const revalidate = 3600; // 1 hour

// Generate static paths at build time
export async function generateStaticParams() {
  const posts = await getAllPosts();
  
  // Add explicit string conversion and filtering
  return posts
    .filter(post => post && post.slug) // Filter out any posts without slugs
    .map((post) => ({
      slug: String(post.slug) // Force conversion to string
    }));
}

// Server component - statically generated with ISR
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }
  
  // Pre-process content on the server
  const processedContent = processContent(post.content, false);
  const darkModeContent = processContent(post.content, true);
  const tableOfContents = extractTableOfContents(post.content);
  const readingTime = calculateReadingTime(post.content);
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white relative">
      <BlogDisplay 
        post={post}
        processedContent={processedContent}
        darkModeContent={darkModeContent}
        tableOfContents={tableOfContents}
        readingTime={readingTime}
      />
    </div>
  );
}