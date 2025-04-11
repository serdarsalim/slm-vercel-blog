// src/app/[handle]/components/AuthorBlogContent.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
// Add a proper type for your category data
interface CategoryWithCount {
  name: string;
  count: number; // Explicitly typed as number
}

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
  const { author } = useAuthor();

  const [renderedCount, setRenderedCount] = useState(8);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebounce(searchInput, 300);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [isBrowser, setIsBrowser] = useState(false);

  // Set browser state for hydration safety
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Apply debounced search
  useEffect(() => {
    setSearchTerm(debouncedSearchTerm);
    setRenderedCount(8);
  }, [debouncedSearchTerm]);

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
    setSelectedCategories([cat]);
    setRenderedCount(8);
  };

  // Apply filters and search
  const filteredPosts = useMemo(() => {
    if (searchTerm && fuse) {
      return fuse.search(searchTerm).map((result) => result.item);
    }

    return posts.filter((p) => {
      if (selectedCategories.includes("all")) return true;

      const postCategories = getCategoryArray(p.categories).map((cat) =>
        cat.toLowerCase().trim()
      );

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

  // Function to load more posts
  const loadMorePosts = () => {
    if (!hasMorePosts || isLoadingMore) return;

    setIsLoadingMore(true);

    setTimeout(() => {
      const newCount = Math.min(renderedCount + 10, sortedPosts.length);
      setRenderedCount(newCount);
      setIsLoadingMore(false);
    }, 600);
  };

  // Get category counts for filter buttons
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
      <section className="pt-0 pb-8 bg-gradient-to-b from-orange-50/50 to-white dark:from-slate-900 dark:to-slate-900 select-none">            <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative text-center mb-6"
          >
            <h2 className="text-lg text-gray-600 dark:text-gray-400 font-semibold mb-2 select-none">
              {author.name}'s Blog Posts
            </h2>
          </motion.div>

          {/* Category filters */}
          <div className="w-full flex flex-wrap justify-center gap-2 mb-6 select-none">
            {[
              { name: "all", count: posts.length } as CategoryWithCount,
              ...Object.entries(categoryCounts)
                .map(
                  ([name, count]): CategoryWithCount => ({
                    name,
                    count: count as number, // Explicitly cast to number
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
              {/* Optimized rendering for better performance */}
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
                        href={`/${author.handle}/blog/${post.slug}`}
                        className="block"
                      >
                        <BlogPostCard
                          post={{
                            ...post,
                            // Ensure we're passing a compatible BlogPost type
                            id: post.id,
                            slug: post.slug,
                            title: post.title,
                            content: post.content,
                            excerpt: post.excerpt || "",
                            date: post.date,
                            categories: post.categories || [],
                            featured: post.featured || false,
                            author: post.author || author.name,
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

              {/* Load more button */}
              {hasMorePosts && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={loadMorePosts}
                    disabled={isLoadingMore}
                    className="px-6 py-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-orange-500 dark:text-orange-300"
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
                        Loading...
                      </span>
                    ) : (
                      "Load More Posts"
                    )}
                  </button>
                </div>
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
