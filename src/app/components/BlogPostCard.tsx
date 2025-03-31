"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { BlogPost } from "@/app/types/blogpost";

interface BlogPostCardProps {
  post: BlogPost;
  index: number;
  cardVariants: any;
  shouldAnimate?: boolean;
}

export default function BlogPostCard({ 
  post, 
  index, 
  cardVariants,
  shouldAnimate = false
}: BlogPostCardProps) {
  // State to track if image is loaded
  const [imageLoaded, setImageLoaded] = useState(false);
  // State to track if we're on a mobile device
  const [isMobile, setIsMobile] = useState(false);
  // Track component mounted state
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state and detect mobile
  useEffect(() => {
    setIsMounted(true);
    
    // Detect if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Check immediately and on resize
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      setIsMounted(false);
    };
  }, []);

  // Default fallback image - use a small, fast-loading placeholder
  const defaultImage = "https://unsplash.com/photos/HiqaKxosAUA/download?ixid=M3wxMjA3fDB8MXxhbGx8M3x8fHx8fHx8MTc0MjcxODI1MHw&force=true&w=640";

  // Format date once
  const formattedDate = post.date 
    ? new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'No date available';

  // Get primary category
  const primaryCategory = Array.isArray(post.categories) && post.categories.length > 0 
    ? post.categories[0] 
    : typeof post.categories === 'string' ? post.categories : null;

  // Truncate excerpt - memoize this to avoid re-computing on every render
  const truncatedExcerpt = React.useMemo(() => {
    return post.excerpt && post.excerpt.length > 220 
      ? `${post.excerpt.substring(0, 200).trim()}...` 
      : post.excerpt;
  }, [post.excerpt]);

  return (
    <Link
      href={`/blog/${post.slug}`}
      prefetch={index < 3}
      className="w-full h-full block cursor-pointer touch-action-manipulation"
    >
      <div 
        className="bg-white dark:bg-slate-800 
          rounded-xl overflow-hidden 
          shadow-md dark:shadow-slate-700/20
          border border-gray-200 dark:border-slate-700
          active:bg-blue-50 dark:active:bg-slate-700
          transition-colors duration-150
          transform-gpu"
      >
        <div className="flex flex-row">
          {/* Content section */}
          <div className="p-4 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
              {post.title}
            </h3>

            <p className="hidden sm:block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-auto line-clamp-3">
              {truncatedExcerpt}
            </p>

            {/* Date display */}
            <div className="flex items-center mt-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formattedDate}
              </span>
              
              {primaryCategory && (
                <>
                  <span className="mx-1 text-gray-300 dark:text-gray-600">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {primaryCategory}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Image with modifications to ensure it works on mobile */}
          <div className="relative w-20 h-20 sm:w-48 sm:h-32 flex-shrink-0 m-3 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
            {/* Show placeholder immediately */}
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md" />
            
            {/* The image itself */}
            <Image
              src={post.featuredImage || defaultImage}
              alt={`${post.title} featured image`}
              fill
              className={`
                object-cover
                rounded-md
                transition-opacity duration-200
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              sizes={isMobile ? "80px" : "192px"}
              priority={index < 10} // Force priority for first 10
              loading="eager" // Force eager loading
              onLoad={() => {
                if (isMounted) setImageLoaded(true);
              }}
              onLoadingComplete={() => {
                if (isMounted) setImageLoaded(true);
              }}
              unoptimized={index < 10} // Bypass image optimization for first 10
            />
          </div>
        </div>
      </div>
    </Link>
  );
}