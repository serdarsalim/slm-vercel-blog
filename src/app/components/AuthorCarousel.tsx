// src/app/components/AuthorCarousel.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// Define the author type explicitly
export interface Author {
  id: string;
  handle: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
}

// Define the component props interface
export interface AuthorCarouselProps {
  authors: Author[];
}

// Export the component as default
export default function AuthorCarousel({ authors }: AuthorCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [visibleAuthors, setVisibleAuthors] = useState(3);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Handle resize for responsive display
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      
      if (width < 768) {
        setVisibleAuthors(1);
      } else if (width < 1024) {
        setVisibleAuthors(2);
      } else {
        setVisibleAuthors(3);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If no authors, don't render
  if (!authors || authors.length === 0) {
    return null;
  }

  // Handle navigation
  const goToNext = () => {
    setCurrentIndex((prev) => 
      prev === authors.length - visibleAuthors ? 0 : prev + 1
    );
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? authors.length - visibleAuthors : prev - 1
    );
  };

  // Handle touch events for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    
    // Only register as swipe if moved more than 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left, go next
        goToNext();
      } else {
        // Swiped right, go prev
        goToPrev();
      }
    }
  };

  return (
    <div className="w-full py-6 pb-12 relative">
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-2 md:px-6 z-10 pointer-events-none">
        {/* Previous Button */}
        <button 
          onClick={goToPrev}
          className="h-10 w-10 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md backdrop-blur-sm text-gray-700 dark:text-gray-200 pointer-events-auto focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Previous author"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Next Button */}
        <button 
          onClick={goToNext}
          className="h-10 w-10 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center shadow-md backdrop-blur-sm text-gray-700 dark:text-gray-200 pointer-events-auto focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Next author"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Carousel Container */}
      <div 
        ref={carouselRef}
        className="overflow-hidden mx-auto max-w-5xl px-4 mb-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div 
          className="flex"
          animate={{ x: `calc(-${100 / visibleAuthors}% * ${currentIndex})` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {authors.map((author) => (
            <div 
              key={author.id} 
              className="flex-shrink-0" 
              style={{ width: `calc(100% / ${visibleAuthors})` }}
            >
              <div className="px-2 md:px-4 h-full pb-6">
  <Link href={`/${author.handle}`} className="block h-full">
  <div className="rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 transition-colors duration-300 hover:border-orange-500 dark:hover:border-orange-500 h-full flex flex-col shadow-sm" style={{ backgroundColor: "var(--card-bg-color)" }}>
                    {/* Fixed height content area - ensures uniform card sizes */}
                    <div className="p-6 text-center flex flex-col h-full">
                      {/* Avatar */}
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-orange-200 dark:border-orange-800 flex-shrink-0">
                        {author.avatar_url ? (
                          <Image 
                            src={author.avatar_url} 
                            alt={author.name} 
                            width={96}
                            height={96}
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full bg-orange-100 dark:bg-orange-800/30 flex items-center justify-center text-2xl text-orange-500 dark:text-orange-300 font-bold">
                            {author.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      {/* Author Info */}
                      <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                        {author.name}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                        @{author.handle}
                      </p>
                      
                      {/* Bio Container - Fixed height with overflow hidden */}
                      <div className="flex-grow mb-4 overflow-hidden">
                        {author.bio ? (
                          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                            {author.bio}
                          </p>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
                            {author.name} is a HALQA author.
                          </p>
                        )}
                      </div>
                      
                      {/* View Profile Link - Always at bottom */}
                      <div className="mt-auto pt-2">
                        <span className="inline-block text-sm font-medium text-orange-500 dark:text-orange-400 hover:underline">
                          View Profile →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Dots Indicator */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: Math.max(1, authors.length - visibleAuthors + 1) }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentIndex 
                ? 'bg-orange-100' 
                : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
            aria-label={`Go to author group ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}