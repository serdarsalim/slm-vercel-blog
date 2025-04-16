// src/app/page.tsx
import { getAllAuthors } from '@/lib/author-data';
import { robustFetchPosts } from '@/lib/robust-posts-fetch';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Import the carousel component with dynamic import to avoid hydration issues
const AuthorCarousel = dynamic(() => import('./components/AuthorCarousel'), { 
  ssr: false  // Disable server-side rendering for the carousel
});

export default async function LandingPage() {
  // Get authors and posts
  const authors = await getAllAuthors();
  const latestPosts = await robustFetchPosts(6);
  
  console.log(`Fetched ${latestPosts?.length || 0} posts with robust method`);
  console.log(`Found ${authors?.length || 0} authors for carousel`);
  
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-orange-50/50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl pb-2 font-bold mb-6 leading-relaxed bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">

              A minimal setup blog platform.
              <br />
              That uses Google Sheets!
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto text-gray-600 dark:text-gray-300">
              Wait! It's definitely easier to use than you think! You don't have to draft your blog in formulas.
            </p>
            <Link 
              href="/join"
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200"
            >
              Join WriteAway
            </Link>
          </div>
        </div>
      </section>
      
      {/* Value Proposition Section */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Data Ownership */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-6">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">You Own Your Data</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Everything lives in your Google Sheet. Edit, backup, or export your content however you want.
              </p>
            </div>
            
            {/* One-Click Publishing */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-6">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Publish With a Checkbox</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Publish or unpublish multiple posts at once with simple checkboxes. No complex workflows.
              </p>
            </div>
            
            {/* Minimalist Design */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold mb-3">Focus on Content</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Clean, distraction-free design lets your readers focus on what matters - your words.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Content Section - MOVED HIGHER */}
      <section className="py-16 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">See What's Possible</h2>
          
          {latestPosts && latestPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latestPosts.map(post => {
                // Ensure all required fields exist and have fallbacks
                const postId = post?.id || `post-${Math.random()}`;
                const postTitle = post?.title || "Untitled Post";
                const postSlug = post?.slug || "";
                const postExcerpt = post?.excerpt || "";
                const postDate = post?.date ? new Date(post.date).toLocaleDateString() : "No date";
                const postImage = post?.featuredImage || "";
                const authorName = post?.author || post?.author_handle || "Anonymous";
                const authorHandle = post?.author_handle || "anonymous";
                
                return (
                  <Link 
                    href={`/${authorHandle}/${postSlug}`} 
                    key={postId}
                    className="group"
                  >
                    <div className="bg-white dark:bg-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col transform group-hover:translate-y-[-4px]">
                      {postImage ? (
                        <div className="relative h-48 overflow-hidden">
                          <Image
                            src={postImage}
                            alt={postTitle}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized={true}
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-r from-orange-100 to-orange-200 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center">
                          <svg className="w-12 h-12 text-orange-500 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                          </svg>
                        </div>
                      )}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-orange-500 transition-colors line-clamp-2">
                          {postTitle}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                          By {authorName} · {postDate}
                        </p>
                        {postExcerpt && (
                          <p className="text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                            {postExcerpt}
                          </p>
                        )}
                        <div className="mt-auto">
                          <span className="text-sm font-medium text-orange-500 dark:text-orange-400 group-hover:underline">
                            Read more →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="inline-block p-6 bg-white dark:bg-slate-700 rounded-lg shadow-sm mb-6">
                <svg className="w-16 h-16 text-orange-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                <h3 className="text-xl font-semibold mb-2">Ready for new content</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Be the first to publish an amazing post with WriteAway!
                </p>
                <Link 
                  href="/join"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors inline-block"
                >
                  Get Started
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Author Carousel Section - NOW AFTER CONTENT */}
      {authors && authors.length > 0 && (
        <section className="py-16 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6 text-center">Meet Our Authors</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-center mb-10">
              Join a growing community of writers who love the simplicity of spreadsheet-powered publishing.
            </p>
            
            {/* Use client component with next/dynamic - increased container height */}
            <div className="min-h-[400px] flex items-center justify-center pb-8">
              {/* This ensures we pass the right author structure */}
              <AuthorCarousel 
                authors={authors.map(author => ({
                  id: author.id || String(Math.random()),
                  handle: author.handle || '',
                  name: author.name || 'Anonymous',
                  bio: author.bio || undefined,
                  avatar_url: author.avatar_url || undefined,
                  website_url: author.website_url || undefined
                }))} 
              />
            </div>
            
            {/* View All Authors Link */}
            <div className="text-center mt-8">
              <Link 
                href="/authors"
                className="inline-flex items-center text-orange-500 hover:text-orange-600 font-medium"
              >
                <span>View all authors</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}
      
      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-br from-orange-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Start Publishing Today</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            From spreadsheet to published in minutes
          </p>
          <Link 
            href="/join"
            className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200 inline-block"
          >
            Join WriteAway
          </Link>
        </div>
      </section>
    </div>
  );
}