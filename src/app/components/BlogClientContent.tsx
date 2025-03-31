"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import BlogPostCard from "./BlogPostCard";
import type { BlogPost } from "@/app/types/blogpost";

interface BlogClientContentProps {
  initialPosts: BlogPost[];
  initialFeaturedPosts: BlogPost[];
}

// Debounce hook for search input
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
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10; // Show 10 posts per page

  // Search state - separate immediate input from applied search term for debouncing
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [isVisible, setIsVisible] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [contentReady, setContentReady] = useState(false);
  
  // Apply debounced search term
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
    // Reset to first page when search changes
    setCurrentPage(1);
  }, [debouncedSearchTerm]);
  
  // Create Fuse instance for search functionality - optimized!
  const fuse = useMemo(
    () => {
      if (posts && posts.length > 0) {
        return new Fuse(posts, {
          keys: [
            { name: 'title', weight: 1.8 },     // Higher weight for title
            { name: 'excerpt', weight: 1.2 },   // Medium priority for excerpt
            { name: 'categories', weight: 1.5 } // High weight for categories
            // Removed 'content' which is expensive to search
          ],
          threshold: 0.2,              // Strict threshold (requires 80% match)
          ignoreLocation: true,        // Better for blog content
          useExtendedSearch: false,    // Simpler algorithm
          minMatchCharLength: 3,       // Keep minimum match length
          distance: 100,               // More conservative than default
          includeScore: true,          // Include match score
          shouldSort: true,            // Sort by score
          findAllMatches: false        // Optimize performance
        });
      }
      return null;
    },
    [posts]
  );

  // Effect to delay rendering for proper UI loading sequence
  useEffect(() => {
    setIsVisible(true);
    
    // Small delay to ensure navbar is loaded first
    const timer = setTimeout(() => {
      setContentReady(true);
    }, 1);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle category selection logic
  const handleCategoryClick = (cat: string) => {
    setSelectedCategories((prev) => {
      if (cat === "all") return ["all"];
      const newCategories = prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev.filter((c) => c !== "all"), cat];
      return newCategories.length === 0 ? ["all"] : newCategories;
    });
    // Reset to first page when category changes
    setCurrentPage(1);
  };

  if (!contentReady) {
    return null; // Return nothing until navbar has had time to load
  }

  // First apply filters and search to all posts
  const filteredPosts = searchTerm && fuse
    ? fuse.search(searchTerm).map((result) => result.item)
    : posts.filter((p) => {
        // Show all posts if "all" is selected
        if (selectedCategories.includes("all")) return true;

        // Handle categories consistently as an array
        const postCategories = Array.isArray(p.categories)
          ? p.categories
          : p.categories
          ? [p.categories]
          : [];

        // Case-insensitive comparison with trimmed whitespace
        return selectedCategories.some((selectedCat) =>
          postCategories.some(
            (postCat) =>
              postCat &&
              typeof postCat === "string" &&
              postCat.toLowerCase().trim() === selectedCat.toLowerCase().trim()
          )
        );
      });

  // Separate featured and non-featured posts
  const featuredPosts = filteredPosts.filter(post => post.featured);
  const nonFeaturedPosts = filteredPosts.filter(post => !post.featured);

  // Combine: featured posts first, then non-featured posts
  const sortedPosts = [...featuredPosts, ...nonFeaturedPosts];
     
  // Calculate pagination
  const totalPages = Math.ceil(sortedPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = sortedPosts.slice(indexOfFirstPost, indexOfLastPost);
  
  // Calculate category counts for filter buttons
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

  // Animation variants for card appearance - simplified
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05, // Reduced delay
        duration: 0.3,   // Faster animation
        ease: "easeOut", 
      },
    }),
  };

  return (
    <>
      {/* Hero Section */}
      <section className="py-10 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-900 select-none">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 1 }}
            className="relative text-center mb-6"
          >
            {/* Simplified animation */}
            <motion.div
              className="absolute -top-10 left-1/2 w-40 h-40 rounded-full bg-blue-100/60 dark:bg-blue-400/10 filter blur-3xl opacity-60 dark:opacity-30"
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut",
              }}
            />

            <h2 className="text-lg text-gray-600 dark:text-gray-400 font-semibold mb-4 select-none">
              Digital notes on some interests. 🧶
            </h2>

            <div className="absolute -z-10 inset-0 bg-gradient-radial from-blue-50/50 via-transparent to-transparent dark:from-blue-500/5 dark:via-transparent dark:to-transparent" />
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

          {/* Search bar with debounced input */}
          <div className="relative w-full mb-6">
            <input
              type="text"
              placeholder="Search posts..."
              className="w-full px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <AnimatePresence>
              {searchInput && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-4 top-3 cursor-pointer"
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                  }}
                >
                  <span className="text-gray-400 dark:text-gray-500 text-lg">
                    ×
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Search status indicator */}
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

      {/* Blog Post List Section */}
      <section
        id="blog"
        className="py-10 bg-white dark:bg-slate-900 -mt-14 relative w-full"
      >
        {/* Fixed container formatting */}
        <div className="w-full px-4 mb-20 sm:max-w-3xl sm:mx-auto">
          {currentPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-400 dark:text-gray-500">
                No posts found matching your criteria. Try a different search
                term or category.
              </p>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Render current page posts - only animate first 3 */}
              {currentPosts.map((post, index) => (
                <BlogPostCard 
                  key={post.id || post.slug}
                  post={post}
                  index={index}
                  cardVariants={cardVariants}
                  shouldAnimate={index < 3} // Only animate first 3 posts
                />
              ))}
              
              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-10 select-none">
                  {/* Previous button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`
                      px-3 py-1 mx-1 rounded-md text-sm
                      ${currentPage === 1
                        ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}
                    `}
                  >
                    &larr;
                  </button>
                  
                  {/* Page numbers - show limited range around current page */}
                  {Array.from({ length: totalPages }).map((_, i) => {
                    // Show first page, last page, and 1 page before and after current
                    const pageNum = i + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`
                            px-3 py-1 mx-1 rounded-md text-sm
                            ${currentPage === i + 1
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}
                          `}
                        >
                          {i + 1}
                        </button>
                      );
                    }
                    
                    // Show ellipsis for gaps
                    if (
                      (pageNum === currentPage - 2 && pageNum > 2) ||
                      (pageNum === currentPage + 2 && pageNum < totalPages - 1)
                    ) {
                      return (
                        <span key={i} className="px-3 py-1 mx-1 text-gray-500">
                          &hellip;
                        </span>
                      );
                    }
                    
                    return null;
                  })}
                  
                  {/* Next button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`
                      px-3 py-1 mx-1 rounded-md text-sm
                      ${currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
                        : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}
                    `}
                  >
                    &rarr;
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}