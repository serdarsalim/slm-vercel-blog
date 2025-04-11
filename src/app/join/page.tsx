"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function JoinPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [joinDisabled, setJoinDisabled] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [handleValid, setHandleValid] = useState(true);
  const [handleError, setHandleError] = useState<string | null>(null);
  
  // Check if join page is disabled
  useEffect(() => {
    async function checkJoinStatus() {
      try {
        const response = await fetch('/api/author/join-status');
        const data = await response.json();
        
        if (data.disabled) {
          setJoinDisabled(true);
          setError(data.message || 'Join requests are currently disabled');
        }
      } catch (err) {
        console.error('Failed to check join status:', err);
      }
    }
    
    checkJoinStatus();
  }, []);

  // Check if email is already used (with debounce)
  useEffect(() => {
    if (!email || email.length < 5 || !email.includes('@')) return;
    
    const timer = setTimeout(async () => {
      setEmailCheckLoading(true);
      try {
        const response = await fetch(`/api/author/check-email?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        
        setEmailExists(data.exists);
        if (data.exists) {
          setError('This email is already registered');
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Failed to check email:', err);
      } finally {
        setEmailCheckLoading(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [email]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !handle || !email) {
      setError('Name, handle, and email are required');
      return;
    }
    
    // Validate handle length
    if (handle.length < 4) {
      setError('Username must be at least 4 characters long');
      return;
    }
    
    // Check if email already exists
    if (emailExists) {
      setError('This email is already registered');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/author/request-join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          handle,
          email,
          bio,
          website
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      // Success!
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Auto-generate handle from name
// Replace the useEffect for handle generation
useEffect(() => {
  // Only auto-generate when name changes AND handle is empty
  if (name && handle === '') {
    const generatedHandle = name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_') // Replace invalid chars with underscore
      .replace(/_{2,}/g, '_'); // Replace multiple underscores with single one
    setHandle(generatedHandle);
  }
}, [name]);
// Replace the handle onChange handler
const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  
  // Allow empty value
  setHandle(value);
  
  // Validate for allowed characters
  const validPattern = /^[a-zA-Z0-9_]*$/;
  const isValidChars = validPattern.test(value);
  
  if (!isValidChars && value !== '') {
    setHandleError('Only letters, numbers, and underscores allowed');
    setHandleValid(false);
  } else if (value.length > 0 && value.length < 4) {
    setHandleError('Username must be at least 4 characters');
    setHandleValid(false);
  } else {
    setHandleError(null);
    setHandleValid(true);
  }
};
  
  if (joinDisabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Join Requests Paused</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We're currently not accepting new author requests. Please check back later!
          </p>
          <Link 
            href="/"
            className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
          >
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Request Submitted!</h1>
            <p className="text-green-600 dark:text-green-400 mb-4">Your author request has been received</p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We'll review your request and contact you via email if approved. Thank you for your interest!
            </p>
            <Link 
              href="/"
              className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
            >
              Return to homepage
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Join WriteAway</h1>
            <p className="text-gray-600 dark:text-gray-300">Be among the brave who can say, ‘I blog… on a spreadsheet.’ </p>
          </div>
          
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name*
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-700 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="handle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <input
  id="handle"
  type="text"
  value={handle}
  onChange={handleHandleChange}
  className={`w-full px-4 py-2 border ${
    !handleValid && handle !== ''
      ? 'border-red-300 dark:border-red-700' 
      : 'border-gray-300 dark:border-slate-600'
  } rounded-md focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-700 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white`}
  required
/>
{handleError && (
  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
    {handleError}
  </p>
)}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This will be your URL: writeaway.blog/{handle}
                </p>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address*
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailExists(false);
                    }}
                    className={`w-full px-4 py-2 border ${
                      emailExists
                        ? 'border-red-300 dark:border-red-700' 
                        : 'border-gray-300 dark:border-slate-600'
                    } rounded-md focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-700 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white`}
                    required
                  />
                  {emailCheckLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-orange-500 rounded-full border-t-transparent"></div>
                    </div>
                  )}
                </div>
                {emailExists && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    This email is already registered
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio (optional)
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-700 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website URL (optional)
                </label>
                <input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-700 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  placeholder="https://"
                />
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || emailExists || (handle && handle.length < 3)}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <Link 
              href="/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400"
            >
              Return to home page
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}