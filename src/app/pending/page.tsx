"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Form state
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [handleValid, setHandleValid] = useState(true);
  const [handleError, setHandleError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Check auth status and load profile data
 // Modify this useEffect in your pending page:

// Check auth status and load profile data
useEffect(() => {
  if (status === "unauthenticated") {
    router.push('/login');
    return;
  }
  
  if (status === "authenticated" && session?.user?.email) {
    // Pre-fill name from session if available
    if (session.user.name) {
      setName(session.user.name);
    }
    
    // Check if user has an author profile or pending request
    fetch('/api/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          const userStatus = data.profile.status;

          if (userStatus === 'active') {
            // Existing author - redirect to dashboard
            router.push('/dashboard');
          } else if (userStatus === 'pending') {
            // Check if the profile has any bio or website info
            // If not, it's likely a new user who hasn't completed their profile
            if (!data.profile.bio && !data.profile.website_url) {
              // New user - show profile form
              setName(data.profile.name || session.user.name || '');
              setHandle(data.profile.handle || '');
              setIsLoading(false);
            } else {
              // Existing pending request - show waiting message
              setIsPending(true);
              setIsLoading(false);
            }
          } else {
            // Incomplete profile - pre-fill data
            setName(data.profile.name || session.user.name || '');
            setHandle(data.profile.handle || '');
            setBio(data.profile.bio || '');
            setWebsite(data.profile.website_url || '');
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error("Error checking profile:", err);
        setIsLoading(false);
      });
  }
}, [status, session, router]);

  // Auto-generate handle - keep this from your original code
  useEffect(() => {
    if (name && handle === '') {
      const generatedHandle = name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_{2,}/g, '_');
      setHandle(generatedHandle);
    }
  }, [name]);

  // Handle validation - keep your existing code
  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHandle(value);
    
    // Your existing validation logic
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
  
  // Handle form submission - modified to update profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !handle) {
      setError('Name and handle are required');
      return;
    }
    
    // Validate handle length
    if (handle.length < 4) {
      setError('Username must be at least 4 characters long');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          handle,
          bio,
          website_url: website
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      // Success!
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin h-5 w-5 border-2 border-orange-500 rounded-full border-t-transparent"></div>
          <span className="text-gray-700 dark:text-gray-300">Loading...</span>
        </div>
      </div>
    );
  }
  
  // After your existing isLoading check
if (isPending) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Request Pending</h1>
          <p className="text-orange-600 dark:text-orange-400 mb-4">Your request is being reviewed</p>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We'll review your submission and contact you when your account is approved.
          </p>
          <Link href="/" className="text-orange-500 hover:text-orange-600 font-medium">
            Return to homepage
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

  // Success state - keep your existing UI
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8"
        >
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Profile Completed!</h1>
            <p className="text-green-600 dark:text-green-400 mb-4">Your author profile has been submitted</p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              We'll review your request and contact you when your account is approved. Thank you for joining revalidation!
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
  
  // Main form - mostly keep your existing UI with some tweaks
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Complete Your Profile</h1>
            <p className="text-gray-600 dark:text-gray-300">You're almost there! Tell us a bit more about yourself.</p>
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
                  Username*
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
                  This will be your URL: revalidation.xyz/{handle}
                </p>
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
                  disabled={isLoading || (handle && handle.length < 4) || !handleValid}
                  className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Complete Profile'}
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