"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Fuse from "fuse.js";
import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/app/types/blogpost";
import { useBlogPosts } from "@/app/hooks/blogService";

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-hidden">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        }
      >
        <BlogIndexContent />
      </Suspense>
    </div>
  );
}

function BlogIndexContent() {
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
    : posts.filter(
        (p) =>
          selectedCategories.includes("all") ||
          selectedCategories.every((cat) =>
            p.categories.map((c) => c.toLowerCase()).includes(cat.toLowerCase())
          )
      );

  // Sort posts by date (newest first)
  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate category counts for the filter buttons
  const categoryCounts = posts.reduce((acc, post) => {
    post.categories.forEach((cat) => {
      const lowerCat = cat.toLowerCase();
      acc[lowerCat] = (acc[lowerCat] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  return (
    <>
      {/* Page header - clean, minimalist design */}
      <header className="relative z-10 py-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl font-bold text-gray-900 dark:text-white inline-flex items-center gap-3"
            >
              Blog
              <span className="text-xl font-normal text-gray-600 dark:text-gray-300 align-middle">
                digital notes on my interests
              </span>
            </motion.h1>
          </motion.div>
        </div>
      </header>

      {/* Blog Posts Section - consistent container width */}
      <section className="relative z-10 py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Search and filters - clean design */}
          <div className="flex justify-center mb-10">
            <div className="w-20"> {/* Search bar: half size */}
              <div className="relative">
                <motion.input
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  type="text"
                  placeholder="Search..."
                  className="w-20 px-2 py-3 rounded-lg text-black dark:text-white bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-600 focus:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <AnimatePresence>
                  {searchTerm && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-2 top-1.5 cursor-pointer"
                      onClick={() => setSearchTerm("")}
                    >
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        ×
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Filter pills - subtle animations */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {[
              { name: "all", count: posts.length },
              ...Object.entries(categoryCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count),
            ].map(({ name, count }) => (
              <motion.button
                key={name}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleCategoryClick(name)}
                className={`
                  px-3 py-1.5
                  rounded-lg 
                  transition-all 
                  duration-200
                  font-medium
                  text-sm
                  flex items-center
                  ${
                    selectedCategories.includes(name)
                      ? "bg-blue-500 text-white shadow-sm"
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                  }
                `}
              >
                <span>
                  {name === "all"
                    ? "All Posts"
                    : name.charAt(0).toUpperCase() + name.slice(1)}
                  <span
                    className={`
                      ml-2
                      inline-flex items-center justify-center 
                      w-5 h-5
                      rounded-full text-xs font-bold
                      ${
                        selectedCategories.includes(name)
                          ? "bg-white text-blue-500"
                          : "bg-gray-500/20 text-gray-700 dark:bg-gray-600/40 dark:text-gray-300"
                      }
                    `}
                  >
                    {count}
                  </span>
                </span>
              </motion.button>
            ))}
          </motion.div>

          {/* Loading & No Results states - subtle animations */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-200 dark:bg-blue-900 opacity-75"></div>
                <div className="relative animate-spin w-8 h-8 m-2 border-2 border-blue-500 rounded-full border-t-transparent"></div>
              </div>
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                Loading posts...
              </p>
            </motion.div>
          ) : sortedPosts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-gray-500 dark:text-gray-400">
                No posts found matching your criteria. Try a different search term or category.
              </p>
            </motion.div>
          ) : (
            /* Blog post cards - clean, minimal design with subtle effects */
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch"
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
                  className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden transform transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]"
                >
                  <Link href={`/blog/${post.slug}`} className="block h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
                    {/* Image area with subtle hover effect */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        className="object-cover transition-transform duration-500 hover:scale-[1.03]"
                        fill
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white line-clamp-2">
                        {post.title}
                      </h2>
                      
                      <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
                      
                      <div className="mt-auto text-xs text-gray-500 dark:text-gray-400">
                        {post.date}
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