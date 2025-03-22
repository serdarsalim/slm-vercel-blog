"use client"


import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative p-6 text-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700 mt-20" >
      
      <div className="flex justify-center items-center gap-4 mb-4 mt-4">
        <a
          href="https://youtube.com/@SheetsMasterOfficial"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          Subscribe
        </a>

        <a 
          href="https://twitter.com/gsheetsmaster"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        </a>
      
      </div>
      <div className="flex justify-center gap-4 mb-2">



        <Link 
          href="/" 
          className="hover:text-gray-800 dark:hover:text-white transition-colors"
        >
          Home
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
      
      
      
      <p>© {new Date().getFullYear()} Serdar Salim. All Rights Reserved.</p>
    </footer>
  );
}