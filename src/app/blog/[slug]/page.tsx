import { getPostBySlug, getAllPosts } from '@/lib/data';
import BlogPostContent from './BlogPostContent';
import { notFound } from 'next/navigation';

// Enable ISR with a reasonable cache time
export const revalidate = 3600; // 1 hour (you can adjust this)

// Generate static paths at build time
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}

// Server component - statically generated with ISR
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    notFound();
  }
  
  // Pass server-fetched data to client component
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white relative">
      <BlogPostContent initialPost={post} />
    </div>
  );
}