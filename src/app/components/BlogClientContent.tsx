"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import BlogPostCard from "./BlogPostCard";
import type { BlogPost } from "@/app/types/blogpost";
import { getCategoryArray } from "@/app/utils/categoryHelpers";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";


const DEFAULT_CATEGORY = "personal";

type AuthorProfile = {
  name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  website_url?: string | null;
};

interface BlogClientContentProps {
  initialPosts?: BlogPost[];
  initialFeaturedPosts?: BlogPost[];
  authorProfile?: AuthorProfile | null;
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
  authorProfile = null,
}: BlogClientContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";
  // All posts are rendered at once on load

  // Search state
  const [searchInput, setSearchInput] = useState(initialSearch);
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const [searchTerm, setSearchTerm] = useState("");

  const initialHasDefaultCategory =
    Array.isArray(initialPosts) &&
    initialPosts.some((post) =>
      getCategoryArray(post.categories).some(
        (cat) => cat.toLowerCase().trim() === DEFAULT_CATEGORY
      )
    );

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialHasDefaultCategory ? [DEFAULT_CATEGORY] : ["all"]
  );
  
  // Use server-provided posts directly
  const [posts, setPosts] = useState<BlogPost[]>(Array.isArray(initialPosts) ? initialPosts : []);
  const [isBrowser, setIsBrowser] = useState(false);

  // Set browser state for hydration safety
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Apply debounced search
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    const nextTerm = searchParams?.get("search") || "";
    setSearchInput(nextTerm);
  }, [searchParams]);

  const clearSearchFilters = useCallback(() => {
    setSearchInput("");
    setSearchTerm("");

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
  const handleCategoryClick = (cat: string) => {
    // Always select exactly one category - the one clicked
    setSelectedCategories([cat]);
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

  // All posts rendered at once
  const visiblePosts = sortedPosts;

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

  const filterButtons = useMemo(() => {
    const sorted = Object.entries(categoryCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const personalIndex = sorted.findIndex(
      ({ name }) => name === DEFAULT_CATEGORY
    );
    if (personalIndex > 0) {
      const [personal] = sorted.splice(personalIndex, 1);
      sorted.unshift(personal);
    }

    return [...sorted, { name: "all", count: posts.length }];
  }, [categoryCounts, posts.length]);

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

  const bioText = authorProfile?.bio?.trim() || "Digital notes on my interests. 🧶";
  const avatarUrl = authorProfile?.avatar_url?.trim();
  const websiteUrl = authorProfile?.website_url?.trim();
  const websiteHref = websiteUrl
    ? websiteUrl.startsWith("http")
      ? websiteUrl
      : `https://${websiteUrl}`
    : null;
  const websiteLabel = websiteUrl
    ? websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;
  const avatarFallbackInitial =
    ((authorProfile?.name || "SD").trim().charAt(0).toUpperCase()) || "S";

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
            initial={{ opacity: 0.9, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative flex flex-row flex-wrap sm:flex-nowrap gap-4 sm:gap-6 items-start text-left mb-6"
          >
            <div className="flex-shrink-0">
              <div className="relative h-20 w-20 sm:h-24 sm:w-24 overflow-hidden rounded-xl ring-2 ring-orange-200 dark:ring-slate-700 bg-orange-100/50">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={authorProfile?.name ? `${authorProfile.name} avatar` : "Author avatar"}
                    fill
                    sizes="96px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-2xl font-semibold text-white">
                    {avatarFallbackInitial}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {bioText}
              </p>
              {websiteHref && websiteLabel && (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium text-orange-600 dark:text-orange-300 hover:text-orange-700 dark:hover:text-orange-200 transition-colors"
                >
                  <span className="mr-2">🌐</span>
                  {websiteLabel}
                </a>
              )}
            </div>
          </motion.div>

          {/* Category filters */}
          <div className="w-full flex flex-wrap justify-center md:justify-between lg:justify-start gap-2 lg:gap-3 mb-6 select-none">
            {filterButtons.map(({ name, count }) => (
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

            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}
