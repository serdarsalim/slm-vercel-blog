"use client";
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function ScrollManager() {
  const pathname = usePathname();
  const router = useRouter();
  const isNavigatingBack = useRef(false);
  
  useEffect(() => {
    // Detect back button navigation
    const handlePopState = () => {
      isNavigatingBack.current = true;
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  useEffect(() => {
    // Handle homepage navigation
    if (pathname === '/') {
      // If we navigated back to the homepage
      if (isNavigatingBack.current) {
        // Reset flag for next navigation
        isNavigatingBack.current = false;
        
        // Get saved position
        const savedPosition = sessionStorage.getItem('homeScrollPosition');
        
        if (savedPosition) {
          // Important: Apply the position immediately to prevent flicker
          requestAnimationFrame(() => {
            // Prevent visible scroll movement
            document.documentElement.style.scrollBehavior = 'auto';
            window.scrollTo(0, parseInt(savedPosition, 10));
            
            // Restore smooth scrolling after position is set
            setTimeout(() => {
              document.documentElement.style.scrollBehavior = '';
            }, 100);
          });
        }
      }
    }
  }, [pathname]);
  
  useEffect(() => {
    // Save position when clicking blog links
    const handleLinkClick = (e) => {
      const target = e.target.closest('a');
      
      if (!target) return;
      
      // Only save position for clicks on blog post links
      if (pathname === '/' && target.pathname?.startsWith('/blog/')) {
        // Save current scroll position
        sessionStorage.setItem('homeScrollPosition', window.scrollY.toString());
      }
    };
    
    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, [pathname]);
  
  return null;
}