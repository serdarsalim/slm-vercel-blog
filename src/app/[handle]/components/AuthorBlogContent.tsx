"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Fuse from "fuse.js";
import { useAuthor } from "../AuthorContext";
import BlogPostCard from "@/app/components/BlogPostCard";
import type { BlogPost } from "@/app/types/blogpost";
import { getCategoryArray } from "@/app/utils/categoryHelpers";

interface AuthorBlogContentProps {
  initialPosts: any[];
  initialFeaturedPosts: any[];
}

interface CategoryWithCount {
  name: string;
  count: number;
}

// Debounce hook with stable reference
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

export default function AuthorBlogContent({
  initialPosts,
  initialFeaturedPosts,
}: AuthorBlogContentProps) {
  // Constants
  const POSTS_PER_PAGE = 15;
  
  // Context
  const { author } = useAuthor();
  
  // Core state
  const [posts] = useState<any[]>(initialPosts); // Made this readonly since you're not updating it
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search and filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Mark as loaded initially and reset page when search term changes
  useEffect(() => {
    if (initialPosts && !hasLoadedInitially) {
      setHasLoadedInitially(true);
    }
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedCategories, initialPosts, hasLoadedInitially]);

  // Create search index with memoization
  const fuse = useMemo(() => {
    if (!posts?.length) return null;
    
    return new Fuse(posts, {
      keys: [
        { name: "title", weight: 1.8 },
        { name: "excerpt", weight: 1.2 },
        { name: "categories", weight: 1.5 },
      ],
      threshold: 0.2,
      ignoreLocation: true,
      minMatchCharLength: 3,
    });
  }, [posts]);

  // Filter posts by search term and categories
  const filteredPosts = useMemo(() => {
    let result = posts;

    // Apply search filter
    if (debouncedSearchTerm && fuse) {
      result = fuse.search(debouncedSearchTerm).map(result => result.item);
    }

    // Apply category filter
    if (!selectedCategories.includes("all")) {
      result = result.filter(post => {
        const postCategories = getCategoryArray(post.categories)
          .map(cat => cat.toLowerCase().trim());
        
        return selectedCategories.some(selectedCat => 
          postCategories.includes(selectedCat.toLowerCase().trim())
        );
      });
    }

    return result;
  }, [posts, fuse, debouncedSearchTerm, selectedCategories]);

  // Sort posts (featured first) - removed problematic ref dependency
  const sortedPosts = useMemo(() => {
    const featuredPosts = filteredPosts.filter(post => post.featured);
    const nonFeaturedPosts = filteredPosts.filter(post => !post.featured);
    return [...featuredPosts, ...nonFeaturedPosts];
  }, [filteredPosts]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  
  // Get visible posts for current page
  const visiblePosts = useMemo(() => {
    return sortedPosts.slice(startIndex, endIndex);
  }, [sortedPosts, startIndex, endIndex]);

  // Handle category filter selection
  const handleCategoryClick = useCallback((cat: string) => {
    setSelectedCategories([cat]);
  }, []);

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of posts section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  // Calculate category counts for filters
  const categoryCounts = useMemo(() => {
    return posts.reduce((acc, post) => {
      const categories = getCategoryArray(post.categories);
      
      categories.forEach((cat) => {
        if (cat) {
          const lowerCat = cat.toLowerCase().trim();
          acc[lowerCat] = (acc[lowerCat] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);
  }, [posts]);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
        delay: i * 0.05,
      },
    }),
    exit: { opacity: 0, transition: { duration: 0.2 } },
    hover: {
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <>
      {/* Blog Header Section */}
      <section className="pt-0 pb-8 bg-gradient-to-b from-orange-50/50 to-white dark:from-slate-900 dark:to-slate-900 select-none">            
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative text-center mb-6"
          />

          {/* Category filters with search icon */}
          <AnimatePresence>
            {!isSearchExpanded && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full flex flex-wrap justify-center pt-4 gap-2 mb-6 select-none"
              >
                {/* Render all category buttons */}
                {[
                  { name: "all", count: posts.length } as CategoryWithCount,
                  ...Object.entries(categoryCounts)
                    .map(
                      ([name, count]): CategoryWithCount => ({
                        name,
                        count: count as number,
                      })
                    )
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
                      touch-element
                      ${
                        selectedCategories.includes(name)
                          ? "bg-orange-100 text-slate-800 dark:bg-orange-800/30 dark:text-gray-200 border border-orange-400 dark:border-orange-800"
                          : "bg-white dark:bg-slate-700 sm:hover:bg-orange-200 sm:dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600"
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
                              ? "bg-white text-orange-500 dark:bg-orange-800 dark:text-orange-200"
                              : "bg-gray-50 text-gray-600 dark:bg-slate-600 dark:text-gray-300"
                          }
                        `}
                      >
                        {count}
                      </span>
                    </span>
                  </motion.button>
                ))}
                
                {/* Search Icon Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSearchExpanded(true)}
                  className="px-2 py-1 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-orange-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 transition-colors touch-element"
                  aria-label="Search posts"
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded search input */}
          <AnimatePresence>
            {isSearchExpanded && (
              <motion.div
                className="relative w-full mb-6"
                initial={{ width: "40px", opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                exit={{ width: "40px", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <input
                  type="text"
                  placeholder="Search and you'll find..."
                  className="w-full px-4 py-2 pl-10 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 touch-element"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  autoFocus
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <button
                  className="absolute right-3 top-2.5 cursor-pointer touch-element"
                  onClick={() => {
                    setIsSearchExpanded(false);
                    setSearchInput("");
                  }}
                >
                  <span className="text-gray-400 dark:text-gray-500 text-lg">×</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search results indicator */}
          {debouncedSearchTerm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8"
            >
              {filteredPosts.length === 0
                ? "No posts found matching your search"
                : `Found ${filteredPosts.length} post${
                    filteredPosts.length === 1 ? "" : "s"
                  } matching "${debouncedSearchTerm}"`}
            </motion.div>
          )}
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="py-8 bg-white dark:bg-slate-900 -mt-14 relative w-full">
        <div className="w-full px-4 mb-20 sm:max-w-3xl sm:mx-auto">
          {sortedPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-12"
            >
              <p className="text-gray-400 dark:text-gray-500">
                No posts found matching your criteria. Try a different search
                term or category.
              </p>
            </motion.div>
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-3"
              >
                {visiblePosts.map((post, index) => (
                  <motion.div
                    key={post.id || post.slug}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    whileHover="hover"
                    variants={cardVariants}
                    className="blog-card border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-orange-200 dark:hover:border-orange-900/40 hover:shadow-[1px_1px_0_0_rgba(251,146,60,0.3)] dark:hover:shadow-[1px_1px_0_0_rgba(249,115,22,0.2)]"
                  >
                    <Link
                      href={`/${author.handle}/${post.slug}`}
                      className="block"
                    >
                      <BlogPostCard
                        post={{
                          ...post,
                          id: post.id,
                          slug: post.slug,
                          title: post.title,
                          content: post.content,
                          excerpt: post.excerpt || "",
                          date: post.date,
                          categories: post.categories || [],
                          featured: post.featured || false,
                          author: post.author || author.name,
                          author_handle: post.author_handle || author.handle,
                          featuredImage: post.featuredImage || "",
                          comment:
                            post.comment !== undefined ? post.comment : true,
                          socmed:
                            post.socmed !== undefined ? post.socmed : true,
                          created_at: post.created_at,
                          updated_at: post.updated_at,
                        }}
                        index={index}
                        cardVariants={cardVariants}
                        shouldAnimate={false}
                      />
                    </Link>
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="mt-12 flex justify-center items-center gap-2"
                >
                  {/* Previous Button */}
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${currentPage === 1
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-gray-200 dark:border-slate-600'
                      }
                    `}
                    aria-label="Previous page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {getPageNumbers().map((pageNum, idx) => (
                      <div key={idx}>
                        {pageNum === '...' ? (
                          <span className="px-3 py-2 text-gray-400 dark:text-gray-600">...</span>
                        ) : (
                          <button
                            onClick={() => goToPage(pageNum as number)}
                            className={`
                              px-3 py-2 rounded-md text-sm font-medium transition-colors
                              ${currentPage === pageNum
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-400 dark:border-orange-800'
                                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-gray-200 dark:border-slate-600'
                              }
                            `}
                          >
                            {pageNum}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`
                      px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${currentPage === totalPages
                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-gray-200 dark:border-slate-600'
                      }
                    `}
                    aria-label="Next page"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </motion.div>
              )}

              {/* Page info */}
              {totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400"
                >
                  Page {currentPage} of {totalPages} • {sortedPosts.length} total posts
                </motion.div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}