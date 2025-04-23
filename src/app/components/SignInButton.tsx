"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SignInButtonProps {
  isMobile?: boolean;
}

export default function SignInButton({ isMobile = false }: SignInButtonProps) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  
  if (isLoading) {
    return (
      <button 
        className={`
          ${isMobile
            ? "w-full text-left flex items-center py-2 px-3" 
            : "px-4 py-2 rounded-md"
          } 
          bg-gray-200 dark:bg-gray-700
        `}
      >
        <span className="animate-pulse">Loading...</span>
      </button>
    );
  }
  
  if (session) {
    // User is signed in
    if (isMobile) {
      // Mobile view for signed-in user
      return (
        <div className="space-y-2">
          <Link
            href="/profile"
            className="block w-full text-left py-2 px-3 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/40"
          >
            Profile
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full text-left py-2 px-3 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      );
    }
    
    // Desktop view for signed-in user
    return (
      <div className="flex items-center space-x-2">
        <Link
          href="/profile"
          className="px-4 py-2 rounded-md bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800/40"
        >
          Profile
        </Link>
        <button
          onClick={() => signOut()}
          className="px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Sign out
        </button>
      </div>
    );
  }
  
  // User is not signed in
  if (isMobile) {
    // Mobile view for sign-in button
    return (
      <button
        onClick={() => signIn("google")}
        className="w-full text-left flex items-center py-2 px-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          className="w-4 h-4 mr-2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Sign in
      </button>
    );
  }
  
  // Desktop view for sign-in button
  return (
    <motion.button
      onClick={() => signIn("google")}
      className="group px-3 py-1.5 relative overflow-hidden"
      whileTap={{ scale: 0.95 }}
    >
      <span className="relative z-10 text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        Sign in
      </span>
      <motion.div
        initial={{ scale: 0, opacity: 0.8 }}
        whileTap={{ scale: 1.5, opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 rounded-full bg-blue-400/20 dark:bg-blue-500/20 z-0"
      />
    </motion.button>
  );
}