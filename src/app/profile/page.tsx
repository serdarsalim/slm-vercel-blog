"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AvatarUpload from "../components/AvatarUpload";
import AdminPostManager from "../components/AdminPostManager";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load profile data
  useEffect(() => {
    if (session?.user?.email) {
      setIsLoading(true);
      
      fetch(`/api/profile`)
        .then((res) => res.json())
        .then((data) => {
          if (data.profile) {
            setName(data.profile.name || "");
            setHandle(data.profile.handle || "");
            setBio(data.profile.bio || "");
            setWebsite(data.profile.website_url || "");
            setAvatarUrl(data.profile.avatar_url || "");
            
            // Check if user is admin
            if (data.profile.role === 'admin') {
              setIsAdmin(true);
            }
          }
        })
        .catch((err) => {
          console.error("Error loading profile:", err);
          setMessage({
            type: "error",
            text: "Failed to load profile. Please try again.",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [session]);

  // Handler for avatar changes
  const handleAvatarChange = (url: string) => {
    setAvatarUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          handle,
          bio,
          website_url: website,
          avatar_url: avatarUrl,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Profile saved successfully",
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save profile",
        });
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setMessage({
        type: "error",
        text: "An error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12">
      <div className="max-w-5xl mx-auto px-4 space-y-10">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="self-start md:self-auto inline-flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:border-orange-400 hover:text-orange-600 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to profile
          </button>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-gray-200">
              {session?.user?.email}
            </span>
            {isAdmin ? (
              <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">
                Admin
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                Member
              </span>
            )}
          </div>
        </header>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        {session?.user?.status === "pending" && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 text-yellow-700 dark:text-yellow-300">
            Your account is pending approval. You can update your profile information while you wait.
          </div>
        )}
        
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 ${
              message.type === "error"
                ? "bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300"
                : "bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-300"
            }`}
          >
            {message.text}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="space-y-6">
              <div className="grid gap-6">
                <div className="grid gap-x-4 gap-y-3 md:grid-cols-4 items-start">
                  <div className="flex justify-center md:justify-start md:row-span-2 md:self-start">
                    <AvatarUpload
                      currentAvatar={avatarUrl}
                      onAvatarChange={handleAvatarChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={session?.user?.email || ""}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-700 dark:text-gray-300 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Full Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600"
                    />
                  </div>

                  <div>
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      id="website"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600"
                      placeholder="https://"
                    />
                  </div>

                  <div className="md:col-start-2 md:col-span-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-600"
                    />
                  </div>

                  <div className="space-y-4 md:col-start-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

        {isAdmin && (
          <section className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <AdminPostManager />
          </section>
        )}
      </div>
    </div>
  );
}
