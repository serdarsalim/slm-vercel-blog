"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/app/types/blogpost";

interface BlogClientContentProps {
  initialPosts: BlogPost[];
  initialFeaturedPosts: BlogPost[];
}

export default function BlogClientContent({ 
  initialPosts,
  initialFeaturedPosts
}: BlogClientContentProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [isVisible, setIsVisible] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [contentReady, setContentReady] = useState(false);
  
  // Create Fuse instance for search functionality
  const fuse = useMemo(
    () => {
      // Only create a new index if we have posts and they've changed
      if (posts && posts.length > 0) {
        return new Fuse(posts, {
          keys: ["title", "excerpt", "categories", "author"],
          threshold: 0.4,
          // Add these options to make it more efficient
          ignoreLocation: true,
          useExtendedSearch: true,
        });
      }
      return null;
    },
    // Use JSON.stringify to properly detect array changes
    [JSON.stringify(posts?.map(p => p.id))]
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
  };

  if (!contentReady) {
    return null; // Return nothing until navbar has had time to load
  }

  // Filter posts based on search term and selected categories
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

  // Sort posts by date (newest first)
  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

  // Animation variants for card appearance
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  // Default fallback image for posts without featured images
  const defaultImage = "https://unsplash.com/photos/HiqaKxosAUA/download?ixid=M3wxMjA3fDB8MXxhbGx8M3x8fHx8fHx8MTc0MjcxODI1MHw&force=true&w=1920";

  return (
    <>
      {/* Hero Section */}
      <section className="py-10 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-900 dark:to-slate-900 select-none">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 1 }}
            className="relative text-center mb-6"
          >
            {/* Floating shape animation */}
            <motion.div
              className="absolute -top-10 left-1/2 w-40 h-40 rounded-full bg-blue-100/60 dark:bg-blue-400/10 filter blur-3xl opacity-60 dark:opacity-30"
              animate={{
                x: [0, 10, -10, 0],
                y: [0, -10, 10, 0],
                scale: [1, 1.05, 0.95, 1],
              }}
              transition={{
                repeat: Infinity,
                duration: 12,
                ease: "easeInOut",
                delay: 0.5,
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
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(name)}
                className={`
                  px-2 py-1 
                  rounded-lg 
                  transition-all 
                  duration-200 
                  font-normal
                  text-xs
                  flex items-center
                  z-10 relative
                  cursor-pointer
                  ${
                    selectedCategories.includes(name)
                      ? "bg-blue-200 text-slate-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-400 dark:border-blue-800"
                      : "bg-white dark:bg-slate-700 hover:bg-blue-200 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600"
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <AnimatePresence>
              {searchTerm && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute right-4 top-3 cursor-pointer"
                  onClick={() => setSearchTerm("")}
                >
                  <span className="text-gray-400 dark:text-gray-500 text-lg">
                    ×
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Blog Post List Section */}
          {/* Blog Post List Section */}
      <section
        id="blog"
        className="py-10 bg-white dark:bg-slate-900 -mt-14 relative w-full"
      >
        {/* Fixed container formatting and made sure it's full width */}
        <div className="w-full px-4 mb-20 sm:max-w-3xl sm:mx-auto">
          {sortedPosts.length === 0 ? (
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
              {sortedPosts.map((post, index) => (
                <motion.div
                  key={post.id || post.slug}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                  className="w-full" // Ensure full width on all screens
                >
                  <Link href={`/blog/${post.slug}`} className="block h-full">
                    {/* Card with responsive layout */}
                    <div className="flex flex-row bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-800/90 
  rounded-xl overflow-hidden 
  shadow-[0_3px_10px_-1px_rgba(0,0,0,0.08),0_2px_4px_-2px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)] 
  dark:shadow-[0_3px_10px_-1px_rgba(0,0,0,0.3),0_2px_4px_-2px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.02)] 
  hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.15),0_0_0_1px_rgba(66,153,225,0.15)] 
  dark:hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.5),0_0_0_1px_rgba(66,153,225,0.08)]
  border border-gray-300/60 dark:border-slate-600/60
  hover:border-blue-200 dark:hover:border-blue-800/60
  hover:bg-blue-50/50 dark:hover:bg-slate-700/80
  transform hover:-translate-y-0.5
  transition-all duration-300 ease-out">                    {/* Content section */}
                      <div className="p-4 flex-1 overflow-hidden flex flex-col">
                        {/* Title: Normal on mobile, bold on desktop */}
                        <h3 className="text-sm sm:text-lg font-bold line-clamp-3 sm:line-clamp-2 mb-1 text-slate-800 dark:text-gray-100">
                          {post.title}
                        </h3>

{/* Excerpt with proper 3-line clamp */}
<p className="hidden sm:block text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-auto line-clamp-3">
  {post.excerpt && post.excerpt.length > 220 
    ? `${post.excerpt.substring(0, 200).trim()}...` 
    : post.excerpt}
</p>

                        {/* Date display */}
                        <div className="flex items-center mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                            {new Date(post.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Responsive image: Square on mobile, rectangular on desktop */}
                      <div className="relative w-20 h-20 sm:w-48 sm:h-32 flex-shrink-0 m-3">
                        <Image
                          src={post.featuredImage || defaultImage}
                          alt={post.title}
                          fill
                          className="object-cover rounded-md"
                          sizes="(max-width: 768px) 80px, 192px"
                          priority={index < 3}
                        />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}