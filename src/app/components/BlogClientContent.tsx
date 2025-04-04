"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
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
  initialFeaturedPosts,
}: BlogClientContentProps) {
  // Modern approach - preload all but render incrementally
  const [renderedCount, setRenderedCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollObserverRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<"up" | "down">("down");
  const ticking = useRef(false);
  const [showLoader, setShowLoader] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [isBrowser, setIsBrowser] = useState(false);

  // Track if the component is mounted
  const isMounted = useRef(false);
  // Track last data update time for optimization
  const lastUpdate = useRef(Date.now());

  // Function to refresh post data with optimization
  const refreshPosts = useCallback(async (isManualRefresh = false) => {
    try {
      // Show loader only for manual refreshes
      if (isManualRefresh) {
        setShowLoader(true);
      }
      
      // Optimization: Check if we need to refresh by comparing the cache timestamp
      // First do a lightweight HEAD request
      const response = await fetch('/api/posts?check=timestamp', {
        method: 'HEAD',
        cache: 'no-store'
      });
      
      // If the server indicates we have fresh data, don't fetch again
      const serverCacheAge = response.headers.get('X-Cache-Age');
      const cacheStatus = response.headers.get('X-Cache');
      
      // If cache is recent (less than 5 minutes old) and we've updated in last 10 minutes, skip
      const timeSinceLastUpdate = Date.now() - lastUpdate.current;
      if (
        serverCacheAge && 
        parseInt(serverCacheAge) < 300 && // Less than 5 minutes old server cache
        cacheStatus === 'HIT' &&
        timeSinceLastUpdate < 600000 && // Less than 10 minutes since our last update
        !isManualRefresh
      ) {
        console.log('Using recent cache, skipping refresh');
        if (isManualRefresh) setShowLoader(false);
        return;
      }
      
      // Otherwise fetch fresh data
      const dataResponse = await fetch('/api/posts', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Client-Refresh': Date.now().toString()
        }
      });
      
      if (!dataResponse.ok) {
        throw new Error('Failed to refresh posts');
      }
      
      const freshPosts = await dataResponse.json();
      
      // Only update state if we have new data and component is still mounted
      if (freshPosts.length > 0 && isMounted.current) {
        // Simple comparison of post count and first/last posts
        const hasChanges = 
          freshPosts.length !== posts.length ||
          (freshPosts[0]?.id !== posts[0]?.id) ||
          (freshPosts[freshPosts.length - 1]?.id !== posts[posts.length - 1]?.id);
        
        if (hasChanges) {
          console.log('Updating with fresh data:', freshPosts.length, 'posts');
          setPosts([...freshPosts]);
          lastUpdate.current = Date.now();
        } else {
          console.log('No changes in data detected');
        }
      }
      
      if (isManualRefresh) setShowLoader(false);
    } catch (error) {
      console.error('Error refreshing posts:', error);
      if (isManualRefresh) setShowLoader(false);
    }
  }, [posts]);

  // Set browser state for hydration safety
  useEffect(() => {
    setIsBrowser(true);
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Apply debounced search
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
    // Reset render count when search changes
    setRenderedCount(8);
  }, [debouncedSearchTerm]);

  // Optimized data refreshing - reduced frequency
  useEffect(() => {
    // Initial fetch on component mount (but only if needed)
    if (initialPosts.length === 0) {
      refreshPosts(false); // Not a manual refresh
    }
    
    // Poll much less frequently - once every 5 minutes in production is plenty
    // In development, we can check more often for testing
    const interval = process.env.NODE_ENV === 'development' ? 60000 : 300000; // 1 min dev, 5 min prod
    
    const refreshTimer = setInterval(() => {
      refreshPosts(false); // Background refresh, not manual
    }, interval);
    
    return () => clearInterval(refreshTimer);
  }, [refreshPosts, initialPosts.length]);

  // Refresh when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if it's been at least 5 minutes since last update
        const timeSinceLastUpdate = Date.now() - lastUpdate.current;
        if (timeSinceLastUpdate > 300000) { // 5 minutes
          console.log('Tab visible again, checking for updates...');
          refreshPosts(false); // Not a manual refresh
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshPosts]);

  // Create optimized Fuse instance for search
  const fuse = useMemo(() => {
    if (posts && posts.length > 0) {
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
    }
    return null;
  }, [posts]);

  // Handle category selection
  const handleCategoryClick = (cat: string) => {
    setSelectedCategories((prev) => {
      if (cat === "all") return ["all"];
      const newCategories = prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev.filter((c) => c !== "all"), cat];
      return newCategories.length === 0 ? ["all"] : newCategories;
    });
    // Reset render count when category changes
    setRenderedCount(8);
  };

  // Apply filters and search
  const filteredPosts = useMemo(() => {
    if (searchTerm && fuse) {
      return fuse.search(searchTerm).map((result) => result.item);
    }

    return posts.filter((p) => {
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
  }, [posts, fuse, searchTerm, selectedCategories]);

  // Featured posts first, then regular posts
  const sortedPosts = useMemo(() => {
    const featuredPosts = filteredPosts.filter((post) => post.featured);
    const nonFeaturedPosts = filteredPosts.filter((post) => !post.featured);
    return [...featuredPosts, ...nonFeaturedPosts];
  }, [filteredPosts]);

  // Get only the rendered posts to be shown
  const visiblePosts = useMemo(() => {
    return sortedPosts.slice(0, renderedCount);
  }, [sortedPosts, renderedCount]);

  // Check if there are more posts to load
  const hasMorePosts = renderedCount < sortedPosts.length;

  // Handle smooth incremental loading as user scrolls
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Update scroll direction
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY.current) {
        scrollDirection.current = "down";
      } else if (currentScrollY < lastScrollY.current) {
        scrollDirection.current = "up";
      }

      lastScrollY.current = currentScrollY > 0 ? currentScrollY : 0;
      ticking.current = false;
    };

    // Check if we should load more posts
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          updateScrollDirection();

          // Only try to load more when scrolling down
          if (
            scrollDirection.current === "down" &&
            hasMorePosts &&
            !isLoadingMore
          ) {
            const scrollPercentage =
              (window.scrollY + window.innerHeight) /
              document.body.scrollHeight;

            // When we're 75% down the page, load more
            if (scrollPercentage > 0.75) {
              loadMorePosts();
            }
          }

          ticking.current = false;
        });

        ticking.current = true;
      }
    };

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hasMorePosts, isLoadingMore, sortedPosts.length]);

  // Function to load more posts gradually
  const loadMorePosts = useCallback(() => {
    if (!hasMorePosts || isLoadingMore || !isMounted.current) return;
    
    // Show the loader
    setShowLoader(true);
    setIsLoadingMore(true);
    
    // Add posts in a single batch after a short delay
    setTimeout(() => {
      if (isMounted.current) {
        // Add a batch of posts all at once (up to 10 more)
        const newCount = Math.min(renderedCount + 10, sortedPosts.length);
        setRenderedCount(newCount);
        setIsLoadingMore(false);
        setShowLoader(false);
      }
    }, 600); // Slightly longer delay to show the loader
  }, [hasMorePosts, isLoadingMore, renderedCount, sortedPosts.length]);

  // Get category counts for filter buttons
  const categoryCounts = useMemo(() => {
    return posts.reduce((acc, post) => {
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
  }, [posts]);

  // Animation variants - simplified for better performance
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1], // Improved easing curve
        delay: i * 0.05, // Staggered entrance
      },
    }),
    exit: { opacity: 0, transition: { duration: 0.2 } },
    hover: {
      transition: { duration: 0.2, ease: "easeOut" },
    },
  };

  return (
    <>
      {/* Critical styles for smooth scrolling and no flicker */}
      <style jsx global>{`
        * {
          -webkit-tap-highlight-color: transparent;
        }

        /* Prevent flickering images during scrolling */
        img {
          -webkit-transform: translateZ(0);
          -webkit-backface-visibility: hidden;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }

        /* Optimize rendering */
        .blog-card {
          transform: translateZ(0);
          will-change: transform, opacity;
          contain: content;
        }

        /* Remove 300ms touch delay */
        .touch-element {
          touch-action: manipulation;
        }

        /* Preload critical images */
        @media (min-width: 640px) {
          .blog-article-card-image {
            content-visibility: auto;
          }
        }
      `}</style>

      {/* Hero Section */}
      <section className="py-10 bg-gradient-to-b from-orange-50/50 to-white dark:from-slate-900 dark:to-slate-900 select-none">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
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
          </div>

          {/* Search bar */}
          <div className="relative w-full mb-6">
            <input
              type="text"
              placeholder="Search posts..."
              className="w-full px-4 py-2 rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 touch-element"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                className="absolute right-4 top-3 cursor-pointer touch-element"
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4"
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

      {/* Blog Posts */}
      <section
        id="blog"
        className="py-10 bg-white dark:bg-slate-900 -mt-14 relative w-full"
      >
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
              {/* Optimized rendering for better performance */}
              {isBrowser && (
                <>
                  {visiblePosts.map((post, index) => (
                    <motion.div
                      key={post.id || post.slug}
                      custom={index} // Add custom prop for staggered animation
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      whileHover="hover" // Add hover animation
                      variants={cardVariants}
                      className="blog-card border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-300 hover:border-orange-200 dark:hover:border-orange-900/40 hover:shadow-[1px_1px_0_0_rgba(251,146,60,0.3)] dark:hover:shadow-[1px_1px_0_0_rgba(249,115,22,0.2)]"                    >
                      <BlogPostCard
                        post={post}
                        index={index}
                        cardVariants={cardVariants}
                        shouldAnimate={false}
                      />
                    </motion.div>
                  ))}
                </>
              )}

              {/* Invisible scroll trigger - no visible loading indicator */}
              {hasMorePosts && (
                <div
                  ref={scrollObserverRef}
                  className="h-1 opacity-0"
                  aria-hidden="true"
                />
              )}

              {/* Loading indicator */}
              {showLoader && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center py-8"
                >
                  <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-orange-500 rounded-full animate-spin"></div>
                </motion.div>
              )}
              
              {/* End message - only shown when no more posts */}
              {!hasMorePosts && sortedPosts.length > 10 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center py-6 text-sm text-gray-400 dark:text-gray-500"
                >
                  You've seen all posts
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}