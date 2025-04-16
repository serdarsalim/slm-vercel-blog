//"src/app/blog/components/ReadingBar.tsx"

"use client";

import { useState, useEffect } from 'react';

export default function ReadingBar() {
  const [readingProgress, setReadingProgress] = useState(0);
  
  useEffect(() => {
    const updateReadingProgress = () => {
      const currentProgress = window.scrollY;
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setReadingProgress(
          Number((currentProgress / scrollHeight).toFixed(2)) * 100
        );
      }
    };

    // Initialize on mount
    updateReadingProgress();
    
    // Add event listener
    window.addEventListener('scroll', updateReadingProgress, { passive: true });
    
    // Cleanup
    return () => window.removeEventListener('scroll', updateReadingProgress);
  }, []);
  
  return (
    <div
      className="fixed top-0 left-0 h-1 bg-yellow-400 dark:bg-yellow-600 z-50 transition-all duration-100"
      style={{ width: `${readingProgress}%` }}
    />
  );
}