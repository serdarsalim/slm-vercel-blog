"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const [authorName, setAuthorName] = useState<string | null>(null);
  
  // Extract author handle from URL
 // Extract author handle from URL
const authorHandle = useMemo(() => {
  // Immediately exclude any API path
  if (pathname?.startsWith('/api')) return null;
  
  const pathParts = pathname?.split('/').filter(Boolean);
  
  if (!pathParts || pathParts.length === 0) return null;
  
  // Explicitly exclude these prefixes
  const excludedPrefixes = ['join', 'admin', 'api', 'blog', 'about', 'terms', 'privacy'];
  
  if (pathParts.length === 1 && !excludedPrefixes.includes(pathParts[0])) {
    return pathParts[0];
  }
  
  if (pathParts.length >= 2 && !excludedPrefixes.includes(pathParts[0])) {
    return pathParts[0];
  }
  
  return null;
}, [pathname]);
  
  // Fetch author name when handle changes
  useEffect(() => {
    async function fetchAuthorName() {
      if (!authorHandle) {
        setAuthorName(null);
        return;
      }
      
      try {
        const response = await fetch(`/api/author/${authorHandle}/public`);
        if (response.ok) {
          const data = await response.json();
          setAuthorName(data.author.name);
        }
      } catch (error) {
        console.error("Error fetching author data:", error);
      }
    }
    
    fetchAuthorName(); // Add this line to actually call the function
  }, [authorHandle]);


  // Run once when component mounts
  useEffect(() => {
    setMounted(true);

    // Check for saved theme or system preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  // Toggle dark mode function with document class AND localStorage update
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  // Don't render until mounted (to avoid hydration issues)
  if (!mounted) return null;


  return (
    <nav className="relative top-0 left-0 right-0 z-50 py-2 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-4">
        {/* Logo and Title - Conditional Link */}
        {authorHandle ? (
          <Link href={`/${authorHandle}`} className="group flex items-center space-x-3 relative">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image src="/logo.png" alt="Logo" fill sizes="32px" priority />
              
              {/* Corner glow accent */}
              <div className="absolute top-0 right-0 w-2 h-2 bg-blue-400 dark:bg-blue-300 rounded-full 
                          animate-ping opacity-70 duration-1000 delay-75"></div>
            </div>
            
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-blue-300">
              {authorName || authorHandle} {/* Display name if available, fallback to handle */}
            </span>
          </Link>
        ) : (
          <Link href="/" className="group flex items-center space-x-3 relative">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image src="/logo.png" alt="Logo" fill sizes="32px" priority />
              
              {/* Corner glow accent */}
              <div className="absolute top-0 right-0 w-2 h-2 bg-blue-400 dark:bg-blue-300 rounded-full 
                          animate-ping opacity-70 duration-1000 delay-75"></div>
            </div>
            
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-blue-300">
              WriteAway
            </span>
          </Link>
        )}

        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden relative z-10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
          whileTap={{ scale: 0.9 }}
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-md">
            <AnimatePresence mode="wait">
              {isMenuOpen ? (
                <motion.svg
                  key="close"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-700 dark:text-blue-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ opacity: 1 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="menu"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-700 dark:text-blue-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </motion.svg>
              )}
            </AnimatePresence>
          </div>
        </motion.button>

    
{/* Desktop Navigation */}
<div className="hidden md:flex items-center space-x-1">
  {/* Remove Home and About, keep only Join */}
  {["Join"].map((item) => (
    <Link
      key={item}
      href={`/${item.toLowerCase()}`}
      className="group px-3 py-1.5 relative overflow-hidden"
    >
      <span className="relative z-10 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {item}
      </span>

      {/* Click effect */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        whileTap={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 rounded-full bg-blue-400/20 dark:bg-blue-500/20 z-0"
      />
    </Link>
  ))}

  {/* WriteAway CMS Link */}
  <a
    href="https://script.google.com/macros/s/AKfycbztPt8_juaUchCJZoyQ8syeHQpC6GEh48cTqRz2knSyHtjnb-CyHils68SywO1zUima/exec"
    target="_blank"
    rel="noopener noreferrer"
    className="group px-3 py-1.5 relative overflow-hidden"
  >
    <span className="relative z-10 flex items-center text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
       Editor
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="ml-1 w-4 h-4"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
        />
      </svg>
    </span>
    <motion.div
      initial={{ scale: 0, opacity: 0.8 }}
      whileTap={{ scale: 1.5, opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 rounded-full bg-blue-400/20 dark:bg-blue-500/20 z-0"
    />
  </a>


          {/* Dark Mode Toggle */}
          <motion.button
            onClick={toggleDarkMode}
            whileTap={{ scale: 0.9 }}
            className="ml-2 p-1.5 relative rounded-xl overflow-hidden"
            aria-label={
              darkMode ? "" : ""
            }
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 opacity-80" />

            <motion.div
              initial={false}
              animate={{ rotate: darkMode ? 180 : 0 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="relative z-10"
            >
              {darkMode ? (
                <svg
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </motion.div>

            {/* Glow effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  boxShadow: darkMode
                    ? "0 0 15px 3px rgba(250, 204, 21, 0.4)"
                    : "0 0 15px 3px rgba(59, 130, 246, 0.4)",
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="w-0 h-0 rounded-full"
              />
            </div>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation Menu - Slide down animation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            className="md:hidden border-t border-gray-200 dark:border-gray-700/50 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
           <div className="py-3 px-4 space-y-3">
  {/* Remove Home and About, keep only Join */}
  {["Join"].map((item) => (
    <motion.div
      key={item}
      initial={{ opacity: 1, x: 0 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <Link
        href={`/${item.toLowerCase()}`}
        className="block py-2 px-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        onClick={() => setIsMenuOpen(false)}
      >
        {item}
      </Link>
    </motion.div>
  ))}
  
  {/* WriteAway CMS Link */}
  <motion.div
    initial={{ opacity: 1, x: 0 }}
    animate={{ opacity: 1, x: 0 }}
  >
    <a
      href="https://script.google.com/macros/s/AKfycbztPt8_juaUchCJZoyQ8syeHQpC6GEh48cTqRz2knSyHtjnb-CyHils68SywO1zUima/exec"
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center py-2 px-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      onClick={() => setIsMenuOpen(false)}
    >
      <span>Editor</span>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="ml-1 w-4 h-4"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
        />
      </svg>
    </a>
  </motion.div>
              
              {/* Mobile dark mode toggle */}
              <motion.div
                initial={{ opacity: 1, x: 0 }}
                animate={{ opacity: 1, x: 0 }}
                className="px-3"
              >
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center w-full py-2 px-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <span className="mr-3">
                    {darkMode ? (
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </span>
                  {darkMode ? "" : ""}
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200 dark:bg-gray-700"></div>
    </nav>
  );
}