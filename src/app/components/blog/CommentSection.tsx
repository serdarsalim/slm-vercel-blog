//  src/app/blog/components/CommentSection.tsx
"use client";

import { motion } from "framer-motion";
import { Suspense, useEffect } from "react";
import Utterances from "@/app/components/Utterances";

interface CommentSectionProps {
  slug: string;
}

export default function CommentSection({ slug }: CommentSectionProps) {
  // Apply global comment styles
  useEffect(() => {
    // Add the styles once on mount
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      /* Remove only the border from the container */
      .utterances-container.mt-16.pt-8.border-t {
        border-top: none !important;
      }

      /* Alternative selector to remove border */
      [class*="utterances-container"][class*="border-t"] {
        border-top: none !important;
      }

      /* Also keep the previous selectors for good measure */
      .utterances-frame {
        margin-top: 0 !important;
      }
      
      /* Hide unnecessary headings */
      .utterances-header, 
      .utterances h3, 
      .utterances h4,
      .utterances-container h3,
      iframe[src*="utteranc"] + h3,
      iframe[src*="utteranc"].utterances-frame + h3 {
        display: none !important;
      }
      
      /* Special styling for dark mode */
      .dark .utterances-frame {
        background-color: transparent !important;
      }
    `;
    
    document.head.appendChild(styleElement);
    
    // Clean up on unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.7 }}
      className="pt-12 mt-6"
    >
      <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
        <h3 className="text-xl font-bold mb-6">Comments</h3>
        
        <Suspense fallback={
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-orange-500 rounded-full border-t-transparent"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading comments...</span>
          </div>
        }>
          <Utterances
            repo="serdarsalim/blog-comments"
            issueTerm="pathname"
            label="blog-comment"
            theme={null} // Let it auto-detect based on site theme
          />
        </Suspense>
      </div>
    </motion.div>
  );
}