'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './utterances.css';

interface UtterancesProps {
  repo: string;              // Format: 'username/repo'
  issueTerm: string;         // 'pathname', 'url', 'title', or specific issue number
  label?: string;            // Optional label for GitHub issues
  theme?: string;            // Optional theme override
  crossOrigin?: string;      // Optional crossorigin attribute
  showTitle?: boolean;       // Show the Comments title
  showGuidelines?: boolean;  // Show commenting guidelines
  showGitHubLink?: boolean;  // Show link to GitHub issues
}

export default function EnhancedUtterances({
  repo,
  issueTerm = 'pathname',
  label = '',
  theme: themeProp,
  crossOrigin = 'anonymous',
  showTitle = true,
  showGuidelines = true,
  showGitHubLink = true
}: UtterancesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Detect dark mode from HTML class since you use this approach in your navbar
  const isDarkMode = typeof document !== 'undefined' ? 
    document.documentElement.classList.contains('dark') : 
    false;

  useEffect(() => {
    // Only load the script once
    if (loadedRef.current) {
      return;
    }

    // Get the resolved theme (light/dark) 
    const theme = themeProp || (isDarkMode ? 'github-dark' : 'github-light');
    
    const utterancesScript = document.createElement('script');
    
    // Set script attributes
    utterancesScript.src = 'https://utteranc.es/client.js';
    utterancesScript.setAttribute('repo', repo);
    utterancesScript.setAttribute('issue-term', issueTerm);
    utterancesScript.setAttribute('theme', theme);
    utterancesScript.setAttribute('crossorigin', crossOrigin);
    
    if (label) {
      utterancesScript.setAttribute('label', label);
    }
    
    // Clear container and append the script
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(utterancesScript);
      loadedRef.current = true;
    }
    
  }, [repo, issueTerm, label, themeProp, crossOrigin, isDarkMode]);

  // Handle theme changes
  useEffect(() => {
    if (!themeProp) {
      const theme = isDarkMode ? 'github-dark' : 'github-light';
      const iframe = containerRef.current?.querySelector<HTMLIFrameElement>('.utterances-frame');
      
      if (iframe) {
        const message = {
          type: 'set-theme',
          theme: theme
        };
        iframe.contentWindow?.postMessage(message, 'https://utteranc.es');
      }
    }
  }, [isDarkMode, themeProp]);
  
  // Add loading state detection
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      // When the iframe is added to the container, hide the loading state
      if (containerRef.current?.querySelector('.utterances-frame')) {
        setIsLoading(false);
        observer.disconnect();
      }
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current, { childList: true, subtree: true });
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="utterances-container mt-16 pt-8 border-t border-gray-100 dark:border-gray-800"
    >
      {showTitle && (
        <motion.h3 
          className="text-xl font-bold mb-6 flex items-center"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <svg 
            className="w-5 h-5 mr-2 text-gray-700 dark:text-gray-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" 
            />
          </svg>
          Comments
        </motion.h3>
      )}

      
      {/* Loading state */}
      {isLoading && (
        <motion.div 
          className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <svg 
            className="animate-spin -ml-1 mr-3 h-5 w-5" 
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
          <span>Loading comments...</span>
        </motion.div>
      )}
      
      {/* Comments container with fancy styling */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        className="relative"
      >
        <div 
          ref={containerRef} 
          className="utterances-comments bg-white dark:bg-transparent rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 p-4 overflow-hidden"
        />
        
        {/* Light/dark transition effect */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-white dark:to-slate-900 opacity-10 dark:opacity-20"></div>
      </motion.div>
      
     
    </motion.div>
  );
}