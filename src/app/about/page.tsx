"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-hidden">
      {/* Grid Background - Restored Google Sheets-like appearance */}
    

      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <AboutContent />
      </Suspense>
    </div>
  );
}

function AboutContent() {
  const [hoverCell, setHoverCell] = useState(null);

  // Animation variants for the grid cells
  const cellVariants = {
    hover: { scale: 1.05, backgroundColor: "rgba(167, 185, 214, 0.3)" },
    tap: { scale: 0.95 },
  };

  return (
    <>
      <main className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 py-24 pt-32 min-h-screen  -mt-20">
        {/* Mission Statement */}
        <motion.div
          className="w-full max-w-4xl mb-8 md:mb-12 -mt-15"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-t-4 border-green-300">
            <motion.h1
              className="text-3xl md:text-4xl font-extrabold tracking-tight text-green-500 dark:text-red-400 mb-4 md:mb-6"
              tabIndex={0}
            >
              What's WriteAway
            </motion.h1>

            <div className="prose prose-lg text-gray-700 dark:text-gray-300 max-w-none">
              <p>
It's this next level blog that utilizes Google Sheets and Next.js to publish blog posts. Created by Serdar Domurcuk.       </p>
            </div>
          </div>
        </motion.div>

        {/* Vision Section */}
        <motion.div
          className="w-full max-w-4xl mb-8 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-t-4 border-blue-300 relative overflow-hidden">
            {/* Cell Reference */}
            <div className="absolute top-2 right-3 text-xs text-gray-400 font-mono">
              =#VALUE! (But actually priceless)
            </div>

            <motion.h2
              className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4 md:mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              tabIndex={0}
            >
              Portfolio
            </motion.h2>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <p className="text-gray-700 dark:text-gray-300">
                sheetsmaster.co - Free Google Sheets Templates
              </p>

              <p className="text-gray-700 dark:text-gray-300">
               Simplifybudget.com - Get your Free Budget Tracker
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 border-t-4 border-purple-300 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
        >
          {/* Cell Reference */}
          <div className="absolute top-2 right-3 text-xs text-gray-400 font-mono">
            #REF! (Reach out to get this fixed)
          </div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
            className="text-3xl md:text-4xl font-extrabold tracking-tight text-purple-600 dark:text-purple-300 mb-4 md:mb-6"
            tabIndex={0}
          >
            Get In Touch
          </motion.h2>

          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <p className="text-lg mb-4">
              Have a suggestion or question?
            </p>
            <p className="text-lg mb-6">
              Let's discuss!
            </p>

            <motion.a
              href="mailto:contact@sheetsmaster.co"
              className="inline-block text-lg font-semibold text-purple-600 dark:text-purple-400 hover:underline bg-purple-50 dark:bg-purple-900/30 px-6 py-3 rounded-lg mb-5"
              whileHover={{
                scale: 1.03,
                backgroundColor: "rgba(234, 179, 8, 0.15)",
              }}
              aria-label="Get in touch!"
            >
              contact@writeaway.blog (not active yet)
            </motion.a>
          </motion.div>

          {/* Formula Bar Animation - Made more subtle */}
          <motion.div
            className="absolute bottom-2 left-2 right-2 h-6 bg-gray-100 dark:bg-gray-700 rounded flex items-center px-2 text-xs font-mono text-gray-500 dark:text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            =HYPERLINK("mailto:contact@sheetsmaster.co","contact@sheetsmaster.co")
          </motion.div>
        </motion.div>

        
      </main>
    </>
  );
}