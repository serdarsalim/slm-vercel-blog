// src/app/components/AuthorBioHeader.tsx
"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface AuthorBioHeaderProps {
  // These will be fetched from your database
  authorName?: string;
  handle?: string;
  authorBio?: string;
  authorAvatar?: string;
  coverImage?: string;
  // Optional social links
  socialLinks?: Record<string, string>;
  // Optional stats 
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
}

export default function AuthorBioHeader({
  authorName = "John Doe", // Default values until you fetch from your DB
  handle = "johndoe",
  authorBio = "Digital creator sharing insights and stories about technology, life, and everything in between.",
  authorAvatar = "/default-avatar.jpg",
  coverImage,
  socialLinks = {
    twitter: "https://twitter.com/yourusername",
    github: "https://github.com/yourusername",
  },
  postCount = 0,
  followerCount = 0,
  followingCount = 0
}: AuthorBioHeaderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Animation effect once component mounts
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950">
      <div className="relative">
        <div className="relative h-40 sm:h-52 w-full overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`${authorName} cover`}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-orange-100 via-amber-50 to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-white/20 to-transparent dark:from-slate-950/80 dark:via-slate-900/30 dark:to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative -mt-10 sm:-mt-14 rounded-2xl border border-gray-200/70 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl backdrop-blur"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.6 }}
          >
            <div className="pt-14 sm:pt-16 p-5 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                <motion.div
                  className="absolute left-1/2 -translate-x-1/2 -top-10 sm:-top-12 w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: isLoaded ? 1 : 0.9, opacity: isLoaded ? 1 : 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {authorAvatar ? (
                    <Image
                      src={authorAvatar}
                      alt={authorName}
                      fill
                      sizes="(max-width: 768px) 96px, 112px"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-orange-100 dark:bg-orange-800/30 flex items-center justify-center text-4xl text-orange-500 dark:text-orange-300 font-bold">
                      {authorName.charAt(0)}
                    </div>
                  )}
                </motion.div>

                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <motion.h1
                      className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 10 }}
                      transition={{ duration: 0.5, delay: 0.25 }}
                    >
                      {authorName}
                    </motion.h1>
                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </div>
                  <motion.div
                    className="text-gray-500 dark:text-gray-400 text-base"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isLoaded ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: 0.35 }}
                  >
                    @{handle}
                  </motion.div>
                </div>

                <div className="flex gap-2 sm:justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold transition-colors"
                  >
                    Follow
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-full border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Message
                  </button>
                </div>
              </div>

              <motion.p
                className="mt-4 text-base text-gray-600 dark:text-gray-300 max-w-3xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.6, delay: 0.45 }}
              >
                {authorBio}
              </motion.p>

              <motion.div
                className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-900/60 px-4 py-3 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
              >
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{postCount}</div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Posts</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{followerCount}</div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Followers</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">{followingCount}</div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Following</div>
                </div>
              </motion.div>

              {socialLinks && Object.keys(socialLinks).length > 0 && (
                <motion.div
                  className="mt-5 flex flex-wrap justify-center gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 10 }}
                  transition={{ duration: 0.6, delay: 0.65 }}
                >
                  {Object.entries(socialLinks).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-slate-700 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-300 hover:border-orange-200 dark:hover:border-orange-800/40 transition-colors"
                      aria-label={platform}
                    >
                      <span className="text-gray-500 dark:text-gray-400">
                        <SocialIcon platform={platform} className="w-4 h-4" />
                      </span>
                      <span className="capitalize">{platform}</span>
                    </a>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// Helper component for social icons
function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  const lowerPlatform = platform.toLowerCase();
  
  // Return appropriate icon based on platform
  switch (lowerPlatform) {
    case 'twitter':
    case 'x':
      return (
        <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 01-2.88 0 1.44 1.44 0 012.88 0z"/>
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"/>
        </svg>
      );
    case 'github':
      return (
        <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
      );
    case 'youtube':
      return (
        <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    case 'website':
      return (
        <svg className={className || "w-6 h-6"} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
      );
    default:
      // Generic link icon for other platforms
      return (
        <svg className={className || "w-6 h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
  }
}
