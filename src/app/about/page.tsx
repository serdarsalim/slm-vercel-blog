"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import JoinButton from '../components/JoinButton';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-hidden">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
          </div>
        }
      >
        <AboutContent />
      </Suspense>
    </div>
  );
}

function AboutContent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <main className="relative z-10 container mx-auto px-4 py-16 max-w-5xl">
      {/* Mission Section */}
      <motion.section
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={fadeInUp}
        transition={{ duration: 0.6 }}
        className="mb-20"
      >
     <div className="text-center mb-12">
  <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Mission</h1>
  <div className="h-1 w-20 bg-orange-500 mx-auto"></div>
</div>

<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
  <p className="text-xl md:text-2xl font-light mb-6 text-center">
    <span className="font-semibold text-orange-500">WriteAway</span> exists to 
    <span className="font-semibold"> rethink how content gets made</span>—by handing creators the tools they already use, and cutting out everything they don’t.
  </p>
  <p className="text-lg mb-6">
  Write, edit, and publish from a clean web interface—no setup, no login, no clutter.
Behind the scenes, your content is safely stored and synced to your Google Drive.
  </p>
  <p className="text-lg mb-6">
   Bonus: Our system lets you edit, reorder, delete, and update content in bulk—instantly. You stay in control, your data stays yours, and your blog stays fast, fresh, and functional.
  </p>
  <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-10">
    <div className="text-center md:text-left">
      <h3 className="font-bold text-2xl mb-2 text-orange-500">Simplicity</h3>
      <p className="text-gray-600 dark:text-gray-300">A familiar spreadsheet interface with serious upgrades—WYSIWYG, images, and structured fields, all in one place.</p>
    </div>
    <div className="text-center md:text-left">
      <h3 className="font-bold text-2xl mb-2 text-orange-500">Innovation</h3>
      <p className="text-gray-600 dark:text-gray-300">Google Sheets becomes your CMS, Supabase your backend, and your blog just works. One click, zero nonsense.</p>
    </div>
    <div className="text-center md:text-left">
      <h3 className="font-bold text-2xl mb-2 text-orange-500">Accessibility</h3>
      <p className="text-gray-600 dark:text-gray-300">If you can use a spreadsheet, you can publish like a pro. No dev team required. No learning curve necessary.</p>
    </div>
  </div>
</div>
      </motion.section>

      {/* Origin Story */}
      <motion.section
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={fadeInUp}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-20"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">The Origin Story</h2>
          <div className="h-1 w-16 bg-orange-500 mx-auto"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="md:w-1/2">
  <p className="text-lg mb-4">
    WriteAway began with a simple, slightly annoyed question: <span className="italic">“Why is blogging still so complicated?”</span>
  </p>
  <p className="text-lg mb-4">
    We were tired of clunky CMS platforms and technical hurdles. Then we realized: almost everyone knows spreadsheets. So why not use them?
  </p>
  <p className="text-lg">
    WriteAway turns Google Sheets into a full CMS—WYSIWYG editor, image manager, live sync and all. No fluff, no plugins. Just clean, efficient publishing from the tool you already know.
  </p>
</div>
            <div className="md:w-1/2 relative h-72 md:h-96 rounded-xl overflow-hidden shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-pink-500 opacity-80 mix-blend-multiply"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white z-10">
                <div className="text-center px-6">
                  <p className="text-5xl font-bold mb-4">2025</p>
                  <p className="text-xl">Launching soon! Join the waitlist!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={fadeInUp}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-20"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">How It Works</h2>
          <div className="h-1 w-16 bg-orange-500 mx-auto"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition-transform hover:scale-105">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-3xl font-bold text-orange-500 mb-6 mx-auto">1</div>
            <h3 className="text-xl font-bold text-center mb-4">Create in Google WebApp</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Write your blog posts in a powerful App interface with custom formatting tools built right in.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition-transform hover:scale-105">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-3xl font-bold text-orange-500 mb-6 mx-auto">2</div>
            <h3 className="text-xl font-bold text-center mb-4">Click to Publish</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              With a single click your post is live on your blog, with no extra steps or technical hurdles.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transform transition-transform hover:scale-105">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-3xl font-bold text-orange-500 mb-6 mx-auto">3</div>
            <h3 className="text-xl font-bold text-center mb-4">Share With the World</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              Your content is instantly available on your customized blog with your own unique URL and profile.
            </p>
          </div>
        </div>
        
        <div className="text-center mt-12">
        <Link 
  href="/api/auth/signin/google?callbackUrl=/pending"
  className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-1 duration-200"
>
  Join WriteAway
</Link>
        </div>
      </motion.section>

      

      {/* Future Vision */}
      <motion.section
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={fadeInUp}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="mb-20"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Future Vision</h2>
          <div className="h-1 w-16 bg-orange-500 mx-auto"></div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl shadow-xl p-8 md:p-12 text-white">
          <p className="text-xl md:text-2xl font-light mb-8 text-center">
            WriteAway is just getting started. Our roadmap includes:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3">Advanced Analytics</h3>
              <p>
                Detailed insights into reader engagement, traffic sources, and content performance directly in your spreadsheet.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
              <p>
                Multi-author support with roles and permissions for editorial teams of any size.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3">Theme Marketplace</h3>
              <p>
                Custom design templates to make your blog uniquely yours without any design skills required.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3">AI-Powered Enhancements</h3>
              <p>
                Intelligent suggestions for titles, SEO improvements, and content optimization.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <p className="text-lg opacity-80">
              Join us in building the future of content creation - where simplicity meets power.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Join the Community */}
      <motion.section
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={fadeInUp}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Community</h2>
          <div className="h-1 w-16 bg-orange-500 mx-auto"></div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 text-center">
          <p className="text-xl mb-8">
            Become part of the WriteAway family and transform how you create and share content.
          </p>
          
           <JoinButton />
          
          <div className="mt-10 pt-10 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              Questions or feedback? We'd love to hear from you.
            </p>
            <a 
              href="mailto:contact@writeaway.blog" 
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              contact@writeaway.blog
            </a>
          </div>
        </div>
      </motion.section>
    </main>
  );
}