// src/app/components/BlogDisplay.tsx

"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AdminPostManager from "./AdminPostManager";
import CommentSection from './blog/CommentSection';
import ShareButtons from './blog/ShareButtons';
import { getCategoryArray } from '@/app/utils/categoryHelpers';
import type { BlogPost } from '@/app/types/blogpost'
import TableOfContents from './blog/TableOfContents';

type TocItem = {
  id: string;
  text: string;
  level: string;
};

interface BlogDisplayProps {
  post: BlogPost;
  processedContent: string;
  darkModeContent: string;
  tableOfContents: TocItem[];
  readingTime: number;
}

export default function BlogDisplay({ 
  post, 
  processedContent, 
  darkModeContent,
  tableOfContents,
  readingTime 
}: BlogDisplayProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { data: session } = useSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isInlineEditorOpen, setIsInlineEditorOpen] = useState(false);
  const [fontStyle, setFontStyle] = useState('serif');
  const [tocExpanded, setTocExpanded] = useState(false);
  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Initial check
    checkDarkMode();
    
    // Setup observer for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadRole = async () => {
      if (!session?.user?.email) return;
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) setIsAdmin(data?.profile?.role === "admin");
      } catch {
        if (!cancelled) setIsAdmin(false);
      }
    };

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);
  
  // Fetch font preferences
  useEffect(() => {
    fetch('/api/preferences')
      .then(res => res.json())
      .then(data => {
        if (data?.fontStyle) {
          setFontStyle(data.fontStyle);
        }
      })
      .catch(err => {
        console.error('Error loading preferences:', err);
      });
  }, []);
  
  // Select the correct pre-processed content based on theme
  const contentToRender = isDarkMode ? darkModeContent : processedContent;
  
  // Format date once
  const formattedDate = post.date ? new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }) : "No date available";

  return (
    <article className="bg-white dark:bg-slate-900 relative">
      {/* Reading progress bar */}

      <div className="container mx-auto px-4 py-10">
        {/* Header Section */}
        <div className="max-w-3xl mx-auto mb-10 px-0 md:px-10 lg:px-9">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-gray-900 dark:text-white mb-6 leading-tight font-bold font-sans text-[1.5em] md:text-[2em] lg:text-[2em]"
          >
            {post.title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-600 dark:text-gray-400 mb-4 text-xs sm:text-sm"
          >
            {/* Date display */}
            <span className="flex items-center mb-1 sm:mb-0">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formattedDate}
            </span>
            
            {/* Category labels */}
            {getCategoryArray(post.categories).map((category, idx) => (
              <motion.span
                key={`cat-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.1 }}
                className="px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded-full mb-1 sm:mb-0"
              >
                {category}
              </motion.span>
            ))}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsInlineEditorOpen(true)}
                className="px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-medium border border-gray-300 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:text-orange-600 hover:border-orange-400 transition-colors"
              >
                Edit
              </button>
            )}
          </motion.div>
        </div>
        <TableOfContents items={tableOfContents} />
       
        {/* Main blog post content */}
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`
              prose prose-base dark:prose-invert
              prose-p:text-[18px] prose-p:leading-[1.65] prose-p:font-[400] sm:prose-p:text-[18px]
              prose-li:text-[18px] prose-li:font-[400] sm:prose-li:text-[18px]
              prose-h2:text-[22px] sm:prose-h2:text-2xl
              prose-h3:text-[19px] sm:prose-h3:text-xl
              
              font-sans font-normal
              [font-weight:400] [-webkit-font-smoothing:antialiased]
              px-0 md:px-10 lg:px-9
                    
              [&>ul>li::marker]:text-slate-800 dark:[&>ul>li::marker]:text-gray-200
              [&>ol>li::marker]:text-slate-800 dark:[&>ol>li::marker]:text-gray-200
              prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:my-3
              prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-24
              prose-h2:text-xl md:prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-lg md:prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4
              prose-headings:text-gray-900 dark:prose-headings:text-white
              prose-a:text-orange-700 dark:prose-a:text-orange-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
              prose-a:transition-colors prose-a:duration-200
              prose-img:rounded-none prose-img:shadow-md prose-img:mx-auto prose-img:my-8             
              prose-hr:my-12 prose-hr:border-gray-200 dark:prose-hr:border-gray-800
              prose-ol:pl-6 prose-ul:pl-6 prose-li:my-3 prose-li:text-gray-800 dark:prose-li:text-gray-200
              prose-ol:text-gray-800 dark:prose-ol:text-gray-200 prose-ul:text-gray-800 dark:prose-ul:text-gray-200
              prose-code:font-normal prose-code:text-orange-700 dark:prose-code:text-orange-400
              prose-code:bg-orange-50 dark:prose-code:bg-orange-900/20 prose-code:px-1.5 prose-code:py-0.5
              prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-gray-900 dark:prose-pre:bg-gray-950 prose-pre:p-4 prose-pre:rounded-lg
              prose-pre:shadow-md prose-pre:overflow-x-auto prose-pre:text-sm prose-pre:my-8
              prose-blockquote:border-l-4 prose-blockquote:border-orange-500
              prose-blockquote:bg-orange-50/30 dark:prose-blockquote:bg-orange-900/10
              prose-blockquote:px-6 prose-blockquote:py-3 prose-blockquote:my-8
              prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
              prose-strong:font-semibold prose-strong:text-gray-900 dark:prose-strong:text-white
              prose-table:rounded-lg prose-table:overflow-hidden prose-table:shadow-sm
              prose-th:bg-gray-100 dark:prose-th:bg-gray-800 prose-th:p-3
              prose-td:p-3 prose-td:border-t prose-td:border-gray-200 dark:prose-td:border-gray-700 max-w-none
              prose-h4:text-base md:prose-h4:text-lg
              [&_h1_span[style*="font-size"]]:font-bold
              [&_h2_span[style*="font-size"]]:font-bold
              [&_h3_span[style*="font-size"]]:font-bold
              [&_span[style*="font-size"]]:!leading-normal
            `}
            dangerouslySetInnerHTML={{ __html: contentToRender }}
          />

          {/* Navigation and share section */}
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {/* Back to Blog - Left side */}
              <Link href="/" className="group mb-6 sm:mb-0">
                <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16l-4-4m0 0l4-4m-4 4h18"
                    />
                  </svg>
                  Back to all posts
                </span>
              </Link>

              {/* Share buttons */}
              {post.socmed && <ShareButtons post={post} />}
            </div>
          </div>

          {/* Comments section */}
          {post.comment && <CommentSection slug={post.slug} />}
        </div>

        {isAdmin && isInlineEditorOpen && (
          <AdminPostManager
            initialPosts={[post]}
            initialSlug={post.slug}
            autoOpenEditor
            hideManagerUI
          />
        )}
      </div>

      {/* Back to top button */}
      <BackToTopButton />
    </article>
  );
}

// Separated to its own component for clarity
function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.3);
    };
    
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-20 right-6 p-3 rounded-full bg-orange-600 text-white shadow-lg z-30"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </motion.button>
  );
}
