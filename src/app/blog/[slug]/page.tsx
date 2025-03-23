"use client";

import { Suspense, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { usePostBySlug } from "@/app/hooks/blogService";
import Link from "next/link";
import Image from "next/image";
import styles from './BlogPost.module.css';  
import Utterances from "@/app/components/Utterances";

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white relative">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        }
      >
        <BlogPostContent />
      </Suspense>
    </div>
  );
}

function BlogPostContent() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : Array.isArray(params.slug) ? params.slug[0] : '';
  const { post, loading, error } = usePostBySlug(slug);
  const [readingProgress, setReadingProgress] = useState(0);
  const [tableOfContents, setTableOfContents] = useState<{id: string, text: string, level: string}[]>([]);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const defaultImage = "https://unsplash.com/photos/HiqaKxosAUA/download?ixid=M3wxMjA3fDB8MXxhbGx8M3x8fHx8fHx8MTc0MjcxODI1MHw&force=true&w=1920";
  
  // Calculate reading progress on scroll
  useEffect(() => {
    if (!post) return;
    
    // Extract headings for table of contents
    if (post.content) {
      const headings = [];
      const regex = /<h([2-3])[^>]*>(.*?)<\/h\1>/g;
      let match;
      while ((match = regex.exec(post.content)) !== null) {
        const level = match[1];
        const text = match[2].replace(/<[^>]*>/g, '');
        const id = text.toLowerCase().replace(/[^\w]+/g, '-');
        headings.push({ id, text, level });
      }
      setTableOfContents(headings);
    }
    
    // Set up scroll tracking for progress bar
    const updateReadingProgress = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setReadingProgress(Number((currentProgress / scrollHeight).toFixed(2)) * 100);
      }
    };
    
    window.addEventListener('scroll', updateReadingProgress);
    return () => window.removeEventListener('scroll', updateReadingProgress);
  }, [post]);

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Handle error or post not found
  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-bold mb-6">Post Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sorry, the blog post you're looking for doesn't exist or has been removed.
        </p>
        <Link 
          href="/"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Function to format the date nicely
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Calculate reading time
  const readingTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200));

  // Helper function to render HTML content safely with id-injected headings
  const renderHtml = (htmlContent: string) => {
    let processedContent = htmlContent;
    
    // Add ids to headings for TOC linking - fixed regex to match headings with or without existing attributes
    processedContent = processedContent.replace(
      /<h([2-3])(?:\s[^>]*)?>(.*?)<\/h\1>/g,
      (match, level, content) => {
        const plainText = content.replace(/<[^>]*>/g, '');
        const id = plainText.toLowerCase().replace(/[^\w]+/g, '-');
        return `<h${level} id="${id}">${content}</h${level}>`;
      }
    );
    
    return { __html: processedContent };
  };

  return (
    <article className="bg-white dark:bg-slate-900 relative">
      {/* Reading progress bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-yellow-400 dark:bg-yellow-600 z-50 transition-all duration-100"
        style={{ width: `${readingProgress}%` }}
      />
      
  {/* Hero section with featured image - improved title readability */}
{post.featuredImage && (
  <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] w-full overflow-hidden">
    <Image 
      src={post.featuredImage || defaultImage}
      alt={post.title}
      fill
      className="object-cover"
      sizes="100vw"
      priority
    />
    {/* Stronger gradient overlay for better text contrast */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/50 to-black/70"></div>
    
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="container mx-auto px-4 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-white max-w-4xl mx-auto leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
        >
          {post.title}
        </motion.h1>
      </div>
    </div>
  </div>
)}
      
      <div className="container max-w-4xl mx-auto px-4 py-10">
        {/* If no featured image, show title here */}
        {!post.featuredImage && (
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight"
          >
            {post.title}
          </motion.h1>
        )}
        
        {/* Post metadata */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400 mb-8"
        >
      
          
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(post.date)}
          </span>
          
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {readingTime} min read
          </span>
          
          {/* Categories */}
          {post.categories && Array.isArray(post.categories) && post.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.categories.map((category, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>
          )}
        </motion.div>
        
        {/* Table of Contents (if post has headings) */}
        {tableOfContents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-10 p-5 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-700"
          >
            <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Table of Contents</h2>
            <nav className="space-y-1">
              {tableOfContents.map((heading, i) => (
                <a 
                  key={i} 
                  href={`#${heading.id}`}
                  className={`block hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 pl-${heading.level === '3' ? '4' : '0'}`}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          </motion.div>
        )}
        
        {/* Post content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className={`
      prose prose-base md:prose-lg
    dark:prose-invert 
    font-serif
    [&>ul>li::marker]:text-blue-600 dark:[&>ul>li::marker]:text-blue-400
    [&>ol>li::marker]:text-blue-600 dark:[&>ol>li::marker]:text-blue-400
    prose-p:text-gray-700 dark:prose-p:text-gray-300 
    prose-p:leading-relaxed prose-p:my-6
    prose-headings:font-sans prose-headings:font-bold
    prose-headings:tracking-tight prose-headings:scroll-mt-24
    prose-h2:text-2xl md:prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
    prose-h3:text-xl md:prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
    prose-headings:text-gray-900 dark:prose-headings:text-white
    prose-a:text-blue-700 dark:prose-a:text-blue-400 
    prose-a:font-medium prose-a:no-underline hover:prose-a:underline
    prose-a:transition-colors prose-a:duration-200
    prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto prose-img:my-8
    prose-hr:my-12 prose-hr:border-gray-200 dark:prose-hr:border-gray-800
    prose-ol:pl-6 prose-ul:pl-6 prose-li:my-3
    prose-li:text-gray-800 dark:prose-li:text-gray-200
    prose-ol:text-gray-800 dark:prose-ol:text-gray-200
    prose-ul:text-gray-800 dark:prose-ul:text-gray-200
    prose-code:font-normal prose-code:text-blue-700 dark:prose-code:text-blue-400 
    prose-code:bg-blue-50 dark:prose-code:bg-blue-900/20 prose-code:px-1.5 prose-code:py-0.5 
    prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
    prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:p-4 prose-pre:rounded-lg 
    prose-pre:shadow-md prose-pre:overflow-x-auto prose-pre:text-sm prose-pre:my-8
    prose-blockquote:border-l-4 prose-blockquote:border-blue-500 
    prose-blockquote:bg-blue-50/30 dark:prose-blockquote:bg-blue-900/10 
    prose-blockquote:px-6 prose-blockquote:py-3 prose-blockquote:my-8
    prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-700
    dark:prose-blockquote:text-gray-300
    prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-white
    prose-table:rounded-lg prose-table:overflow-hidden prose-table:shadow-sm
    prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:p-3
    prose-td:p-3 prose-td:border-t prose-td:border-gray-200 dark:prose-td:border-gray-700
    max-w-none
          `}
          dangerouslySetInnerHTML={renderHtml(post.content)}
        />
        
        {/* Comments section */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.4 }}
>
  <Utterances 
    repo="serdarsalim/blog-comments" 
    issueTerm="pathname" 
    label="blog-comment" 
  />
</motion.div>
       
        
        {/* Share section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800"
        >
          <h3 className="text-xl font-bold mb-4 text-center sm:text-left">Share this article</h3>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              Twitter
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#4267B2]/10 text-[#4267B2] rounded-lg hover:bg-[#4267B2]/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
              Facebook
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#0077B5]/10 text-[#0077B5] rounded-lg hover:bg-[#0077B5]/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </a>
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Link
            </button>
          </div>
        </motion.div>
        
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-8"
        >
          <Link href="/" className="group">
            <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Back to Blog
            </span>
            <span className="text-lg font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
              View all articles
            </span>
          </Link>
        </motion.div>
      </div>
      
      {/* Back to top button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: readingProgress > 20 ? 1 : 0 }}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 text-white shadow-lg z-30"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </motion.button>
      
    </article>
  );
}