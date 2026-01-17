import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlugServer } from '@/lib/data';
import { processContent, extractTableOfContents, calculateReadingTime } from '@/lib/contentProcessor';
import BlogDisplay from '@/app/components/BlogDisplay';

export const revalidate = 60; // Revalidate every minute

const buildExcerpt = (content: string, fallback: string) => {
  const plain = content
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const base = plain || fallback;
  return base.length > 180 ? `${base.slice(0, 170).trim()}...` : base;
};

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlugServer(params.slug);

  if (!post) {
    return {
      title: 'Post not found | Serdar Salim',
      description: 'The requested post could not be found.',
    };
  }

  const url = `https://blog.serdarsalim.com/posts/${post.slug}`;
  const description = buildExcerpt(
    post.content || "",
    post.excerpt || `${post.title} on Serdar Salim`
  );

  return {
    title: `${post.title} | Serdar Salim`,
    description,
    openGraph: {
      title: post.title,
      description,
      url,
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
      type: 'article',
      authors: post.author ? [post.author] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlugServer(params.slug);

  if (!post) {
    notFound();
  }

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
