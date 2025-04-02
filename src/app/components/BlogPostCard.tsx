"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  const [isMounted, setIsMounted] = useState(false);

  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  
  // Get the correct thumbnail URL - 3 sizes for different devices
  const getThumbnailUrl = (originalUrl: string) => {
    if (!originalUrl) return '';
    
    // For Unsplash images
    if (originalUrl.includes('unsplash.com')) {
      // If URL already has width parameter, replace it
      if (originalUrl.includes('&w=')) {
        // Small thumbnail for mobile cards
        return originalUrl.replace(/&w=\d+/, '&w=160');
      } 
      // If URL has no width param, add it
      return `${originalUrl}&w=160`;
    }
    
    // For other image sources, return as is (could be enhanced with more services)
    return originalUrl;
  };

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

  // Truncate excerpt once
  const truncatedExcerpt = React.useMemo(() => {
    return post.excerpt && post.excerpt.length > 220 
      ? `${post.excerpt.substring(0, 200).trim()}...` 
      : post.excerpt;
  }, [post.excerpt]);

  // Get image source with thumbnail optimization - KEEPING EXACTLY AS IS
  const defaultImage = "https://unsplash.com/photos/HiqaKxosAUA/download?ixid=M3wxMjA3fDB8MXxhbGx8M3x8fHx8fHx8MTc0MjcxODI1MHw&force=true&w=160";
  const imageSource = post.featuredImage ? getThumbnailUrl(post.featuredImage) : defaultImage;

  return (
    <Link
      href={`/blog/${post.slug}`}
      prefetch={index < 3}
      className="w-full h-full block cursor-pointer touch-action-manipulation group"
    >
      <div 
        className="bg-white dark:bg-slate-800 
          rounded-xl overflow-hidden 
          shadow-sm hover:shadow-md dark:shadow-slate-700/10
          border border-gray-200 dark:border-slate-700
          hover:border-orange-200 dark:hover:border-orange-800/30
          active:bg-gray-50 dark:active:bg-slate-700/80
          transition-all duration-200
          transform-gpu group-hover:translate-y-[-1px]"
      >
        <div className="flex flex-row">
          {/* Content section */}
          <div className="p-4 flex-1 overflow-hidden flex flex-col">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">
              {post.title}
            </h3>

            <p className="hidden sm:block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-auto line-clamp-3">
              {truncatedExcerpt}
            </p>

            {/* Date and category display */}
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <div className="flex items-center">
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
                
              </div>

            
              {primaryCategory && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
                  {primaryCategory}
                </span>
              )}
            </div>
          </div>

          {/* Image with small thumbnail and blur placeholder - KEEPING STRUCTURE EXACTLY AS IS */}
          <div className="relative w-20 h-20 sm:w-40 sm:h-32 flex-shrink-0 m-3 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
            <Image
              src={imageSource}
              alt={`${post.title} featured image`}
              fill
              className="object-cover rounded-md transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 80px, 160px"
              priority={index < 8}
              unoptimized={true}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}