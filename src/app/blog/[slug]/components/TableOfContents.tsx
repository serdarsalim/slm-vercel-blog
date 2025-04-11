"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

type TableOfContentsProps = {
  items: Array<{
    id: string;
    text: string;
    level: string;
  }>;
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Don't render if less than 2 headings
  if (items.length < 3) return null;
  
  return (
<div className="max-w-3xl mx-auto mb-6 pl-0 pr-4 md:pl-9 md:pr-10 lg:pl-9 lg:pr-9">      <div>
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h2 className="text-lg font-semibold">Post Contents</h2>
          <button 
            aria-label={isExpanded ? 'Collapse contents' : 'Expand contents'}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg 
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Fixed container with transform animation - prevents reflow */}
        <div className="relative overflow-hidden" 
             style={{ height: isExpanded ? 'auto' : '0px' }}>
          <motion.div
            initial={false}
            animate={{ 
              opacity: isExpanded ? 1 : 0,
              y: isExpanded ? 0 : -20
            }}
            transition={{ duration: 0.3 }}
            className="py-2"
          >
            <ul className="space-y-1">
              {items.map((item) => (
                <li 
                  key={item.id} 
                  className={`${item.level === '3' ? 'ml-4' : ''}`}
                >
                  <a 
                    href={`#${item.id}`}
                    className="text-orange-600 dark:text-orange-300 hover:underline"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}