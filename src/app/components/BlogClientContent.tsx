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
import { getCategoryArray } from '@/app/utils/categoryHelpers';
import { useRouter, useSearchParams } from "next/navigation";


interface BlogClientContentProps {
  initialPosts?: BlogPost[];
  initialFeaturedPosts?: BlogPost[];
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
  initialPosts = [],
  initialFeaturedPosts = [],
}: BlogClientContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";
  // Modern approach - preload all but render incrementally
  const [renderedCount, setRenderedCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollObserverRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollDirection = useRef<"up" | "down">("down");
  const ticking = useRef(false);
  const [showLoader, setShowLoader] = useState(false);

  // Search state
  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  
  // Use server-provided posts directly
  const [posts, setPosts] = useState<BlogPost[]>(Array.isArray(initialPosts) ? initialPosts : []);
  const [isBrowser, setIsBrowser] = useState(false);

  // Track if the component is mounted
  const isMounted = useRef(false);

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

  useEffect(() => {
    const nextTerm = searchParams?.get("search") || "";
    setSearchInput(nextTerm);
  }, [searchParams]);

  const clearSearchFilters = useCallback(() => {
    setSearchInput("");
    setSearchTerm("");
    setRenderedCount(8);

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("search");
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  }, [router, searchParams]);

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
// Replace the current handleCategoryClick function with this:
const handleCategoryClick = (cat: string) => {
  // Always select exactly one category - the one clicked
  setSelectedCategories([cat]);
  
  // Reset render count when category changes
  setRenderedCount(8);
};
  // Apply filters and search
// Apply filters and search
const filteredPosts = useMemo(() => {
  if (searchTerm && fuse) {
    return fuse.search(searchTerm).map((result) => result.item);
  }

  return (posts ?? []).filter((p) => {
    // Show all posts if "all" is selected
    if (selectedCategories.includes("all")) return true;

    // Use the same getCategoryArray helper we use elsewhere for consistency
    const postCategories = getCategoryArray(p.categories).map(cat => 
      cat.toLowerCase().trim()
    );
    
    // Debug what's happening
    // console.log('Post:', p.title, 'Categories:', postCategories, 'Selected:', selectedCategories);

    // Check if any selected category matches any post category
    return selectedCategories.some((selectedCat) =>
      postCategories.includes(selectedCat.toLowerCase().trim())
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
      // Use the helper to get clean category array
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

          {searchTerm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 dark:border-orange-900/40 bg-orange-50/80 dark:bg-slate-800/40 px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
            >
              <p>
                Showing results for{" "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  &ldquo;{searchTerm}&rdquo;
                </span>{" "}
                ({filteredPosts.length} match
                {filteredPosts.length === 1 ? "" : "es"})
              </p>
              <button
                onClick={clearSearchFilters}
                className="text-sm font-medium text-orange-600 dark:text-orange-300 hover:underline whitespace-nowrap"
              >
                Clear search
              </button>
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
