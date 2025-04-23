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

              Share your ideas with the world!
            
            </h1>
         
            <Link 
  href="/api/auth/signin/google?callbackUrl=/pending"
  className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200"
>
  Join WriteAway
</Link>
          </div>
        </div>
      </section>
      
     


      {/* Author Carousel Section - NOW AFTER CONTENT */}
      {authors && authors.length > 0 && (
        <section className="py-16 bg-white dark:bg-slate-900">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-6 text-center">How does it look? </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto text-center mb-10">
              Below some of the accounts that are already using WriteAway.
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
            <div className="text-center -mt-5">
              <Link 
                href="/authors"
                className="inline-flex items-center text-orange-500 hover:text-orange-600 font-medium"
              >
                <span>More accounts</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}




 {/* Value Proposition Section */}
 <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 mb-5">
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
              <h3 className="text-2xl font-bold mb-3">Edit and Publish with one Click</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Edit, publish or unpublish multiple posts at once with simple checkboxes. No complex workflows.
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

      

    </div>
  );
}