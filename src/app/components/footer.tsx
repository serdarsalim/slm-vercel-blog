"use client"


import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative p-6 text-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700 mt-20" >
      
    
      <div className="flex justify-center gap-4 mb-2">



        <Link 
          href="/" 
          className="hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          Revalidation
        </Link>
        <Link 
          href="/about"
          className="hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          About
        </Link>
        <Link 
          href="/terms"
          className="hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          Terms
        </Link>
        <Link 
          href="/privacy"
          className="hover:text-gray-800 dark:hover:text-white transition-colors"
    >
          Privacy
        </Link>
      </div>
      
      
      
      <p>© {new Date().getFullYear()} Revalidation. All Rights Reserved.</p>
    </footer>
  );
}