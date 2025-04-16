
// src/app/components/blog/ShareButtons.tsx

"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { BlogPost } from '@/app/types/blogpost';

interface ShareButtonsProps {
  post: BlogPost;
}

export default function ShareButtons({ post }: ShareButtonsProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Share popup helper
  const openSharePopup = (url: string, title: string = "Share") => {
    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    window.open(
      url,
      title.replace(/\s+/g, ""),
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );
  };

  // Copy URL handler
  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
    >
      <div className="flex flex-wrap justify-center sm:justify-end gap-2">
        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm">{copySuccess ? "Copied!" : "Copy Link"}</span>
          
          {copySuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded"
            >
              Copied!
            </motion.div>
          )}
        </button>

        {/* Twitter Share Button */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const postURL = typeof window !== "undefined" ? window.location.href : "";
            const shareText = `${post.title} ${postURL}`;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              shareText
            )}`;
            openSharePopup(twitterUrl, "Share on Twitter");
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#1DA1F2]/10 text-[#1DA1F2] rounded-lg hover:bg-[#1DA1F2]/20 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
          </svg>
          <span className="text-sm">Twitter</span>
        </a>

        {/* Facebook Share Button */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const postURL = typeof window !== "undefined" ? window.location.href : "";
            const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              postURL
            )}`;
            openSharePopup(fbUrl, "Share on Facebook");
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#1877F2]/10 text-[#1877F2] rounded-lg hover:bg-[#1877F2]/20 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
          </svg>
          <span className="text-sm">Facebook</span>
        </a>

        {/* LinkedIn Share Button */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            const postURL = typeof window !== "undefined" ? window.location.href : "";
            const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
              postURL
            )}&title=${encodeURIComponent(post.title)}`;
            openSharePopup(linkedInUrl, "Share on LinkedIn");
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#0077B5]/10 text-[#0077B5] rounded-lg hover:bg-[#0077B5]/20 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
          </svg>
          <span className="text-sm">LinkedIn</span>
        </a>
      </div>
    </motion.div>
  );
}