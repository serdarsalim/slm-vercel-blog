"use client";

import { useEffect, useRef } from 'react';

interface UtterancesProps {
  repo: string;              // Format: 'username/repo'
  issueTerm: string;         // 'pathname', 'url', 'title', or specific issue number
  label?: string;            // Optional label for GitHub issues
  theme?: string;            // Optional theme override
  crossOrigin?: string;      // Optional crossorigin attribute
}

export default function Utterances({
  repo,
  issueTerm = 'pathname',
  label = '',
  theme: themeProp,
  crossOrigin = 'anonymous'
}: UtterancesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);
  
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

  return (
    <div className="utterances-container mt-16 pt-8 border-t border-gray-100 dark:border-gray-800">
      <h3 className="text-xl font-bold mb-6">Comments</h3>
      <div ref={containerRef} className="utterances-comments" />
    </div>
  );
}