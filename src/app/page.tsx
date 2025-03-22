"use client";

import React, { Suspense, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/app/types/blogpost";
import { useBlogPosts } from "@/app/hooks/blogService";

export default function Blog() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-100">
      {/* Outer container with max width to prevent full page width */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 shadow-sm">
        {/* Wrap all client-interactive content in Suspense */}
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-10 w-40 bg-gray-100 dark:bg-slate-700 rounded-md mb-4"></div>
                <div className="h-4 w-60 bg-gray-100 dark:bg-slate-700 rounded-md"></div>
              </div>
            </div>
          }
        >
          <BlogContent />
        </Suspense>
      </div>
    </div>
  );
}

function BlogContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["all"]);
  const [isVisible, setIsVisible] = useState(false);
  const { posts, loading } = useBlogPosts();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(posts, {
        keys: ["title", "excerpt", "categories", "author"],
        threshold: 0.4,
      }),
    [posts]
  );

  const handleCategoryClick = (cat: string) => {
    setSelectedCategories((prev) => {
      if (cat === "all") return ["all"];
      const newCategories = prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : [...prev.filter((c) => c !== "all"), cat];
      return newCategories.length === 0 ? ["all"] : newCategories;
    });
  };

  const filteredPosts = searchTerm
    ? fuse.search(searchTerm).map((result) => result.item)
    : posts.filter((p) => {
        // Always show all posts if "all" is selected
        if (selectedCategories.includes("all")) return true;

        // Make sure categories exist and are handled as an array
        const postCategories = Array.isArray(p.categories)
          ? p.categories
          : p.categories
          ? [p.categories]
          : [];

        // Do case-insensitive comparison and trim whitespace
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

  // Get featured posts
  const featuredPosts = posts.filter((post) => post.featured);

  // Calculate category counts for the filter buttons
  const categoryCounts = posts.reduce((acc, post) => {
    // Make sure categories exist and are always handled as an array
    const categories = Array.isArray(post.categories)
      ? post.categories
      : post.categories
      ? [post.categories]
      : [];

    categories.forEach((cat) => {
      if (cat) {
        // Check that category is defined
        const lowerCat = cat.toLowerCase().trim();
        acc[lowerCat] = (acc[lowerCat] || 0) + 1;
      }
    });
    return acc;
  }, {} as Record<string, number>);

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

  // Default fallback image for posts
  const defaultImage = "https://picsum.photos/id/1039/1000/600";

  return (
    <>
      {/* Hero Section with soft gradient */}
      <section className="py-10 bg-gradient-to-b from-blue-50/50 to-white dark:from-slate-800 dark:to-slate-800/90">
        <div className="max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="relative text-center mb-6"
          >
            {/* Subtle floating shape in background */}
            <motion.div
              className="absolute -top-10 left-1/2 w-40 h-40 rounded-full bg-blue-100/60 dark:bg-blue-400/10 filter blur-3xl opacity-60 dark:opacity-30"
              animate={{
                x: [0, 10, -10, 0],
                y: [0, -10, 10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 12,
                ease: "easeInOut",
              }}
            />

            {/* Title and subtitle */}
            <motion.h2
              className="text-md text-gray-600 dark:text-gray-400 font-semibold mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 1,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              Digital notes on my interests. 📚✨
            </motion.h2>

            {/* Subtle gradient glow */}
            <motion.div
              className="absolute -z-10 inset-0 bg-gradient-radial from-blue-50/50 via-transparent to-transparent dark:from-blue-500/5 dark:via-transparent dark:to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2 }}
            />
          </motion.div>

          {/* Category filters - Softer colors */}
          <div className="w-full flex flex-wrap justify-center gap-2 mb-6">
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
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                      : "bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-slate-600"
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

          {/* Search bar with softer styling */}
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
      <section
        id="blog"
        className="py-10 bg-white dark:bg-slate-800 -mt-14 relative"
      >
        <div className="max-w-3xl mx-auto px-4 mb-20">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 dark:text-gray-500">
                Loading posts...
              </p>
            </motion.div>
          ) : sortedPosts.length === 0 ? (
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
            /* Blog post cards in single column with softer color palette */
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {sortedPosts.map((post, index) => (
                <motion.div
                  key={post.id}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={cardVariants}
                >
                  <Link href={`/blog/${post.slug}`} className="block h-full">
                    {/* Softer card colors */}
                    <div className="flex flex-row bg-slate-100 dark:bg-slate-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 h-32 border border-gray-100 dark:border-slate-600">
                      {/* Content - 4/5 of the space */}
                      <div className="p-4 flex-1 w-4/5 overflow-hidden flex flex-col">
                        <h3 className="text-base font-bold line-clamp-2 mb-1 text-gray-700 dark:text-gray-100">
                          {post.title}
                        </h3>

                        {/* Excerpt - added here with line clamp */}
                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-auto line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>

                      {/* Image - 1/5 of the space */}
                      <div className="relative w-1/5 min-w-[80px]">
                        <Image
                          src={post.featuredImage || defaultImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = defaultImage;
                          }}
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
