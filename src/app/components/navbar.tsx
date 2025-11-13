"use client";

import Link from "next/link";
import { useEffect, useState, FormEvent, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SignInButton from "./SignInButton";

const navLinks = [
  { label: "Blog", href: "/" }
];

export default function Navbar() {
  const [darkMode, setDarkMode] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const paramsSnapshot = useRef("");

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");

    if (!savedTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
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

  useEffect(() => {
    setSearchValue(searchParams?.get("search") || "");
    paramsSnapshot.current = searchParams?.toString() || "";
  }, [searchParams]);

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

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsMenuOpen(false);
  };

  const clearSearch = () => {
    setSearchValue("");
    setIsMenuOpen(false);
  };

  useEffect(() => {
    paramsSnapshot.current = searchParams?.toString() || "";
  }, [searchParams]);

  useEffect(() => {
    if (!mounted) return;

    const handler = setTimeout(() => {
      const trimmed = searchValue.trim();
      const params = new URLSearchParams(paramsSnapshot.current);
      const currentSearch = params.get("search") || "";

      if (trimmed === currentSearch) return;

      if (trimmed) {
        params.set("search", trimmed);
      } else {
        params.delete("search");
      }

      const query = params.toString();
      router.push(query ? `/?${query}` : "/");
    }, 350);

    return () => clearTimeout(handler);
  }, [searchValue, mounted, router]);

  if (!mounted) return null;

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className="relative top-0 left-0 right-0 z-50 py-2 bg-white dark:bg-slate-900 shadow-sm">
      <div className="max-w-4xl mx-auto flex justify-between items-center px-4">
        <Link href="/" className="group flex items-center space-x-3 relative">
          <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700 shadow-[0_6px_18px_rgba(194,65,12,0.45)] flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.5),transparent)]" />
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white/50 blur-sm" />
            <span className="text-xs font-semibold tracking-wide text-white/95 drop-shadow">
              SD
            </span>
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-orange-200">
            Serdar Salim Domurcuk
          </span>
        </Link>

        <button
          className="md:hidden relative z-10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 shadow-md">
            {isMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-700 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </div>
        </button>

        <div className="hidden md:flex items-center space-x-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 transition-colors ${
                isActive(link.href)
                  ? "text-orange-600 dark:text-orange-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <SignInButton />
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center space-x-2 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 shadow-sm"
          >
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search posts"
              className="bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none min-w-[160px]"
            />
            {searchValue && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </form>
          <button
            onClick={toggleDarkMode}
            className="ml-2 p-1.5 rounded-xl"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700/50">
          <div className="py-3 px-4 flex flex-col space-y-2">
            <form onSubmit={handleSearchSubmit} className="flex flex-col space-y-2 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800">
              <label htmlFor="mobile-search" className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Search Posts
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="mobile-search"
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search posts"
                  className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
                <button
                  type="submit"
                  className="text-sm font-semibold text-orange-600 dark:text-orange-300"
                >
                  Go
                </button>
              </div>
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-2 px-3 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? "bg-gray-100 dark:bg-gray-800 text-orange-600 dark:text-orange-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <SignInButton isMobile onNavigate={() => setIsMenuOpen(false)} />

            <button
              onClick={() => {
                toggleDarkMode();
                setIsMenuOpen(false);
              }}
              className="flex items-center py-2 px-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200 dark:bg-gray-700" />
    </nav>
  );
}
