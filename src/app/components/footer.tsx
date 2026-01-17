"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SignInButton from "./SignInButton";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-0 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-900 text-sm text-gray-600 dark:text-gray-300">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-center">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/about" className="hover:text-gray-900 dark:hover:text-white">
            About
          </Link>
          <Link href="/terms" className="hover:text-gray-900 dark:hover:text-white">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-gray-900 dark:hover:text-white">
            Privacy
          </Link>
          <div className="hidden sm:block h-4 w-px bg-gray-300 dark:bg-gray-700" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
            <SignInButton />
            <DarkModeToggle />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800">
        <p className="px-6 py-4 text-center text-xs text-gray-500 dark:text-gray-500">
          © {year} Serdar Salim Domurcuk.
        </p>
      </div>
    </footer>
  );
}

function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");

    if (!savedTheme) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
      return;
    }

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);

    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleDarkMode}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-slate-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-200"
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? (
        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
      <span>{darkMode ? "Light" : "Dark"}</span>
    </button>
  );
}
