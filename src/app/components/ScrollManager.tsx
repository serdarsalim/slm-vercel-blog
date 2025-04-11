"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollManager() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Save homepage scroll position when user scrolls
    const handleScroll = () => {
      if (pathname === '/') {
        sessionStorage.setItem('homepageScrollPos', window.scrollY.toString());
      }
    };
    
    // Throttled scroll event listener
    let timeout: NodeJS.Timeout;
    const throttledScroll = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(handleScroll, 100);
    };
    
    // Add scroll listener only on homepage
    if (pathname === '/') {
      window.addEventListener('scroll', throttledScroll);
    }
    
    // Restore position when returning to homepage
    if (pathname === '/') {
      const savedPosition = sessionStorage.getItem('homepageScrollPos');
      if (savedPosition) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedPosition));
        }, 0);
      }
    }
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [pathname]);
  
  return null;
}