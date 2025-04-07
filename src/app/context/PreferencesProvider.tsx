// src/app/context/PreferencesProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type PreferencesContextType = {
  preferences: {
    fontStyle: string;
    blogTitle?: string;
    headerText?: string;
    about?: string;
    [key: string]: any;
  };
  loading: boolean;
};

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: { fontStyle: 'serif' },
  loading: true,
});

export const usePreferences = () => useContext(PreferencesContext);

export const PreferencesProvider = ({ children }: { children: React.ReactNode }) => {
  const [preferences, setPreferences] = useState({ fontStyle: 'serif' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const response = await fetch('/api/preferences');
        if (!response.ok) throw new Error('Failed to load preferences');
        const data = await response.json();
        setPreferences(data || { fontStyle: 'serif' });
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, []);

  return (
    <PreferencesContext.Provider value={{ preferences, loading }}>
      {children}
    </PreferencesContext.Provider>
  );
};