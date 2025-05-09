"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  // Context and refs
  const { author } = useAuthor();
  const observerTarget = useRef<HTMLDivElement>(null);
  const loadAttempts = useRef(0);
  const postsIdRef = useRef<string>("");
  
  // Core state
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [renderedCount, setRenderedCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Search and filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Add these at the top with your other refs
    const isInitialMount = useRef(true);
    const safeToLoad = useRef(false);

  // Initialize browser state once
  useEffect(() => {
    setIsBrowser(true);
    
    // Clean up any lingering session storage
    sessionStorage.removeItem('alreadyReloaded');
    
    // Safety check for hydration issues (delayed)
    const initialLoadCheck = setTimeout(() => {
      if (isBrowser && posts.length > 0) {
        const hasNoCards = document.querySelectorAll('.blog-card').length === 0;
        if (hasNoCards) {
          setLoadingError('Posts failed to display properly.');
        }
      }
    }, 3000);
    
    return () => clearTimeout(initialLoadCheck);
  }, []); // Run only once on mount

  // Apply debounced search with stable dependencies
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
    if (debouncedSearchTerm !== searchTerm) {
      setRenderedCount(8);
      loadAttempts.current = 0;
    }
  }, [debouncedSearchTerm]);

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
    if (searchTerm && fuse) {
      return fuse.search(searchTerm).map(result => result.item);
    }

    if (selectedCategories.includes("all")) {
      return posts;
    }

    return posts.filter(post => {
      const postCategories = getCategoryArray(post.categories)
        .map(cat => cat.toLowerCase().trim());
      
      return selectedCategories.some(selectedCat => 
        postCategories.includes(selectedCat.toLowerCase().trim())
      );
    });
  }, [posts, fuse, searchTerm, selectedCategories]);

  // Track post IDs for dependency comparison
  useEffect(() => {
    const newPostsId = JSON.stringify(filteredPosts.map(p => p.id));
    postsIdRef.current = newPostsId;
  }, [filteredPosts]);

  // Sort posts (featured first)
  const sortedPosts = useMemo(() => {
    const postsId = postsIdRef.current;
    const featuredPosts = filteredPosts.filter(post => post.featured);
    const nonFeaturedPosts = filteredPosts.filter(post => !post.featured);
    return [...featuredPosts, ...nonFeaturedPosts];
  }, [filteredPosts, postsIdRef.current]);

  // Get visible posts for current view
  const visiblePosts = useMemo(() => {
    return sortedPosts.slice(0, renderedCount);
  }, [sortedPosts, renderedCount]);

  // Check if more posts can be loaded
  const hasMorePosts = useMemo(() => 
    renderedCount < sortedPosts.length, 
    [renderedCount, sortedPosts.length]
  );

  // Handle category filter selection
  const handleCategoryClick = useCallback((cat: string) => {
    setSelectedCategories([cat]);
    setRenderedCount(8);
    loadAttempts.current = 0;
  }, []);

  // Load more posts with safe dependency list
  const loadMorePosts = useCallback(() => {
    if (!hasMorePosts || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Use state updater form to avoid stale closure issues
    setTimeout(() => {
      try {
        setRenderedCount(current => {
          const MAX_POSTS_PER_LOAD = 8;
          return Math.min(current + MAX_POSTS_PER_LOAD, sortedPosts.length);
        });
      } catch (error) {
        console.error('Error loading more posts:', error);
        setLoadingError('Failed to load more posts. Please try again.');
        loadAttempts.current += 1;
      } finally {
        setIsLoadingMore(false);
      }
    }, 500);
  }, [hasMorePosts, isLoadingMore, sortedPosts.length]);

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

  // Setup intersection observer for infinite scroll
  useEffect(() => {
  // Skip setup during SSR or when loading
  if (!isBrowser || isLoadingMore || !hasMorePosts) return;
  
  const currentTarget = observerTarget.current;
  if (!currentTarget) return;
  
  // Create new observer instance
  const observer = new IntersectionObserver(
    (entries) => {
      // Critical fix: Don't trigger loads during initial hydration
      if (!entries[0].isIntersecting || !safeToLoad.current) return;
      
      // Prevent triggering multiple times
      observer.unobserve(currentTarget);
      
      // Add exponential backoff for retries
      const backoffTime = Math.min(2000, Math.pow(2, loadAttempts.current) * 500);
      setTimeout(loadMorePosts, loadAttempts.current > 0 ? backoffTime : 0);
    },
    {
      rootMargin: '100px',
      threshold: 0.1,
    }
  );
  
  observer.observe(currentTarget);
  
  // Flag that we're past initial mount - this breaks the infinite loop
  if (isInitialMount.current) {
    isInitialMount.current = false;
    
    // Set a very short timeout to allow hydration to stabilize
    // This doesn't delay page load - it just prevents immediate triggering
    setTimeout(() => {
      safeToLoad.current = true;
    }, 50);
  }
  
  return () => {
    observer.disconnect();
  };
}, [isLoadingMore, hasMorePosts, isBrowser, loadMorePosts]);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
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
                        count: count as number, // Explicitly tell TypeScript this is a number
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
                    setSearchTerm("");
                  }}
                >
                  <span className="text-gray-400 dark:text-gray-500 text-lg">×</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search results indicator */}
          {searchTerm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8"
            >
              {filteredPosts.length === 0
                ? "No posts found matching your search"
                : `Found ${filteredPosts.length} post${
                    filteredPosts.length === 1 ? "" : "s"
                  } matching "${searchTerm}"`}
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
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              {/* Only render posts on the client side after hydration */}
              {isBrowser && (
                <>
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
                </>
              )}

              {/* Infinite scroll loading trigger */}
              <div
                ref={observerTarget}
                className="py-8 flex justify-center items-center min-h-[100px]"
                aria-hidden="true"
              >
                <AnimatePresence mode="wait">
                  {isLoadingMore && hasMorePosts && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center"
                    >
                      <svg
                        className="animate-spin h-8 w-8 text-orange-500 dark:text-orange-300 mb-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Loading more posts...</span>
                    </motion.div>
                  )}

                  {loadingError && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center text-red-500 dark:text-red-400 py-2"
                    >
                      <p>{loadingError}</p>
                      <button
                        onClick={() => {
                          setLoadingError(null);
                          loadMorePosts();
                        }}
                        className="mt-2 px-4 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-md text-sm hover:bg-orange-200 dark:hover:bg-orange-800/40 transition-colors"
                      >
                        Try Again
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* End of content message */}
                {!hasMorePosts && sortedPosts.length > 8 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="text-center py-4 text-sm text-gray-400 dark:text-gray-500"
                  >
                    You've reached the end
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}