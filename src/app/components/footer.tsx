"use client";

import Link from "next/link";
import SignInButton from "./SignInButton";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-slate-900 text-sm text-gray-600 dark:text-gray-300">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Serdar Salim Domurcuk
          </p>
          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Digital notes on design, technology, and independent work
          </p>
        </div>

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
          <div className="flex flex-col text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
            <span className="mb-1">Admin</span>
            <SignInButton />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800">
        <p className="px-6 py-4 text-center text-xs text-gray-500 dark:text-gray-500">
          © {year} Serdar Salim Domurcuk. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
