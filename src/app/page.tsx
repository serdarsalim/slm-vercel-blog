import { Suspense } from 'react';
import CustomStyles from './components/CustomStyles';
import BlogClientContent from './components/BlogClientContent';
import { getAllPosts, getFeaturedPosts } from '@/lib/data';

export const revalidate = 900;

export default async function Page() {
  const [posts, featuredPosts] = await Promise.all([
    getAllPosts(),
    getFeaturedPosts(),
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative overflow-hidden">
      <CustomStyles />

      {/* Hero */}
      <section className="relative z-10 pt-20 pb-12 sm:pb-16">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-100/40 via-transparent to-transparent dark:from-orange-400/5" />
        <div className="max-w-4xl mx-auto px-4 relative text-center space-y-6">
          <p className="text-sm uppercase tracking-[0.4em] text-orange-500">
            HALQA
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
            One home for every idea I publish.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300">
            No more juggling author portals or mirrored CMS flows. Every post,
            regardless of who originally wrote it, now lives on this single
            landing page for you (and future me) to explore.
          </p>
        </div>
      </section>

      {/* Posts */}
      <section className="relative z-10 pb-16">
        <div className="max-w-5xl mx-auto px-4">
          <Suspense
            fallback={
              <div className="py-20 text-center text-sm text-slate-500">
                Loading posts…
              </div>
            }
          >
            <BlogClientContent
              initialPosts={posts}
              initialFeaturedPosts={featuredPosts}
            />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
