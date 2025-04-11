// src/app/[handle]/AuthorContext.tsx
"use client";

import React, { createContext, useContext } from 'react';

interface Author {
  id: string;
  handle: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  website_url?: string;
  social_links?: any;
  created_at: string;
}

interface AuthorPreferences {
  font_style: string;
  theme_colors?: any;          // Make optional
  featured_posts?: any[];      // Make optional
  sidebar_widgets?: any[];     // Make optional
  custom_css?: string;         // Already optional
}

interface AuthorContextType {
  author: Author;
  preferences: AuthorPreferences;
}

const AuthorContext = createContext<AuthorContextType | undefined>(undefined);

export function AuthorProvider({ 
  children, 
  author,
  preferences
}: { 
  children: React.ReactNode, 
  author: Author,
  preferences: AuthorPreferences
}) {
  return (
    <AuthorContext.Provider value={{ author, preferences }}>
      {children}
    </AuthorContext.Provider>
  );
}

export function useAuthor() {
  const context = useContext(AuthorContext);
  if (!context) {
    throw new Error('useAuthor must be used within an AuthorProvider');
  }
  return context;
}