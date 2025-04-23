"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";

interface SignInButtonProps {
  isMobile?: boolean;
  onNavigate?: () => void;
}

export default function SignInButton({ isMobile = false, onNavigate }: SignInButtonProps) {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  
  // Loading state
  if (isLoading) {
    return <span className={`${isMobile ? "block w-full" : ""} animate-pulse text-gray-500 dark:text-gray-400`}>Loading...</span>;
  }
  
  // Signed in - Mobile view
  if (session && isMobile) {
    return (
      <>
        <Link
          href="/profile"
          className="block text-left py-2 px-3 mb-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 rounded-lg transition-colors"
          onClick={onNavigate}
        >
          Profile
        </Link>
        <button
          onClick={() => {
            signOut();
            if (onNavigate) onNavigate();
          }}
          className="block text-left py-2 px-3 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </>
    );
  }
  
  // Signed in - Desktop view
  if (session && !isMobile) {
    return (
      <>
        <Link
          href="/profile"
          className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400"
        >
          Profile
        </Link>
        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
        >
          Sign out
        </button>
      </>
    );
  }
  
  // Not signed in - Mobile view
  if (!session && isMobile) {
    return (
      <button
        onClick={() => {
          signIn("google");
          if (onNavigate) onNavigate();
        }}
        className="block text-left py-2 px-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <span className="flex items-center">
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
        </span>
      </button>
    );
  }
  
  // Not signed in - Desktop view
  return (
    <button
      onClick={() => signIn("google")}
      className="px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      Sign in
    </button>
  );
}