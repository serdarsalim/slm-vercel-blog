"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import BlogPostCard from "./BlogPostCard";
import type { BlogPost } from "@/app/types/blogpost";

interface BlogClientContentProps {
  initialPosts: BlogPost[];
  initialFeaturedPosts: BlogPost[];
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function BlogClientContent({ 
  initialPosts,
  initialFeaturedPosts
}: BlogClientContentProps) {
  // For infinite scroll
  const [visibleCount, setVisibleCount] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  
  // Apply debounced search
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
    // Reset visible count when search changes
    setVisibleCount(10);
  }, [debouncedSearchTerm]);
  
  // Create optimized Fuse instance for search
  const fuse = useMemo(
    () => {
      if (posts && posts.length > 0) {
        return new Fuse(posts, {
          keys: [
            { name: 'title', weight: 1.8 },
            { name: 'excerpt', weight: 1.2 },
            { name: 'categories', weight: 1.5 }
          ],
          threshold: 0.2,
          ignoreLocation: true,
          minMatchCharLength: 3
        });
      }
      return null;
    },
    [posts]
  );

  // Handle category selection
  const handleCategoryClick = (cat: string) => {
    setSelectedCategories((prev) => {
      if (cat === "all") return ["all"];
      const newCategories = prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev.filter((c) => c !== "all"), cat];
      return newCategories.length === 0 ? ["all"] : newCategories;
    });
    // Reset visible count when category changes
    setVisibleCount(10);
  };

  // Apply filters and search
  const filteredPosts = searchTerm && fuse
    ? fuse.search(searchTerm).map((result) => result.item)
    : posts.filter((p) => {
        // Show all posts if "all" is selected
        if (selectedCategories.includes("all")) return true;

        // Handle categories consistently
        const postCategories = Array.isArray(p.categories)
          ? p.categories
          : p.categories
          ? [p.categories]
          : [];

        return selectedCategories.some((selectedCat) =>
          postCategories.some(
            (postCat) =>
              postCat &&
              typeof postCat === "string" &&
              postCat.toLowerCase().trim() === selectedCat.toLowerCase().trim()
          )
        );
      });

  // Featured posts first, then regular posts
  const featuredPosts = filteredPosts.filter(post => post.featured);
  const nonFeaturedPosts = filteredPosts.filter(post => !post.featured);
  const sortedPosts = [...featuredPosts, ...nonFeaturedPosts];
  
  // Get visible posts for the current scroll position
  const visiblePosts = sortedPosts.slice(0, visibleCount);
  const hasMorePosts = visibleCount < sortedPosts.length;
  
  // Infinite scroll using Intersection Observer
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMorePosts && !isLoading) {
        setIsLoading(true);
        
        // Add 5 more posts after a small delay
        setTimeout(() => {
          setVisibleCount(prev => Math.min(prev + 5, sortedPosts.length));
          setIsLoading(false);
        }, 300);
      }
    },
    [hasMorePosts, isLoading, sortedPosts.length]
  );

  // Set up the observer
  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    
    return () => observer.disconnect();
  }, [observerCallback]);
  
  // Get category counts for filter buttons
  const categoryCounts = posts.reduce((acc, post) => {
    const categories = Array.isArray(post.categories)
      ? post.categories
      : post.categories
      ? [post.categories]
      : [];

    categories.forEach((cat) => {
      if (cat) {
        const lowerCat = cat.toLowerCase().trim();
        acc[lowerCat] = (acc[lowerCat] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeOut", 
      },
    }),
  };

  return (
    <>
      {/* Add this style to fix tap highlight issues on mobile */}
      <style jsx global>{`
        * {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

      {/* Hero Section */}
      <section className="py-10 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-900 select-none">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 1 }}
            className="relative text-center mb-6"
          >
            <h2 className="text-lg text-gray-600 dark:text-gray-400 font-semibold mb-4 select-none">
              Digital notes on some interests. 🧶
            </h2>
          </motion.div>

          {/* Category filters */}
          <div className="w-full flex flex-wrap justify-center gap-2 mb-6 select-none">
            {[
              { name: "all", count: posts.length },
              ...Object.entries(categoryCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            ].map(({ name, count }) => (
              <motion.button
                key={name}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(name)}
                className={`
                  px-2 py-1 
                  rounded-lg 
                  transition-colors
                  duration-200 
                  font-normal
                  text-xs
                  flex items-center
                  z-10 relative
                  cursor-pointer
                  ${
                    selectedCategories.includes(name)
                      ? "bg-blue-200 text-slate-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-400 dark:border-blue-800"
                      : "bg-white dark:bg-slate-700 sm:hover:bg-blue-200 sm:dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600"
                  }
                `}
              >
                <span>
                  {name === "all"
                    ? "All Posts"
                    : name.charAt(0).toUpperCase() + name.slice(1)}
                  <span
                    className={`
                      ml-1
                      inline-flex items-center justify-center 
                      w-4 h-4 
                      rounded-full text-[10px] font-medium
                      ${
                        selectedCategories.includes(name)
                          ? "bg-white text-blue-500 dark:bg-blue-800 dark:text-blue-200"
                          : "bg-gray-50 text-gray-600 dark:bg-slate-600 dark:text-gray-300"
                      }
                    `}
                  >
                    {count}
                  </span>
                </span>
              </motion.button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full mb-6">
            <input
              type="text"
              placeholder="Search posts..."
              className="w-full px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                className="absolute right-4 top-3 cursor-pointer"
                onClick={() => {
                  setSearchInput("");
                  setSearchTerm("");
                }}
              >
                <span className="text-gray-400 dark:text-gray-500 text-lg">
                  ×
                </span>
              </button>
            )}
          </div>
          
          {/* Search results indicator */}
          {searchTerm && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
              {filteredPosts.length === 0
                ? "No posts found matching your search"
                : `Found ${filteredPosts.length} post${
                    filteredPosts.length === 1 ? "" : "s"
                  } matching "${searchTerm}"`}
            </div>
          )}
        </div>
      </section>

      {/* Blog Posts */}
      <section
        id="blog"
        className="py-10 bg-white dark:bg-slate-900 -mt-14 relative w-full"
      >
        <div className="w-full px-4 mb-20 sm:max-w-3xl sm:mx-auto">
          {sortedPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 dark:text-gray-500">
                No posts found matching your criteria. Try a different search
                term or category.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Show current posts */}
              {visiblePosts.map((post, index) => (
                <BlogPostCard 
                  key={post.id || post.slug}
                  post={post}
                  index={index}
                  cardVariants={cardVariants}
                  shouldAnimate={index < 3} // Only animate first 3
                />
              ))}
              
              {/* Loading more indicator */}
              <div
                ref={loadMoreRef}
                className="py-4 flex justify-center items-center h-16"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse delay-150"></div>
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse delay-300"></div>
                  </div>
                ) : hasMorePosts ? (
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    Scroll for more
                  </div>
                ) : sortedPosts.length > 0 ? (
                  <div className="text-sm text-gray-400 dark:text-gray-500">
                    You've reached the end
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}