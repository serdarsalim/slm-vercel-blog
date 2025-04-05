// src/app/context/PreferencesContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getPreferences } from '../hooks/blogService';

type Preferences = {
  fontStyle: string;
};

// Enhance the context type with a refresh function
interface PreferencesContextType {
  preferences: Preferences;
  loading: boolean;
  refreshPreferences: (force?: boolean) => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextType>({
  preferences: { fontStyle: 'serif' },
  loading: true,
  refreshPreferences: async () => {}
});

// Module-level cache to avoid refetching across component instances
const prefCache = {
  lastFetch: 0
};

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState<Preferences>({ fontStyle: 'serif' });
  const [loading, setLoading] = useState(true);
  
  // Create our own refresh function that uses getPreferences directly
  const refreshPreferences = useCallback(async (force = false) => {
    // Skip fetching if not forced and it's been less than 5 minutes
    const now = Date.now();
    if (!force && now - prefCache.lastFetch < 5 * 60 * 1000) {
      return;
    }
    
    // Set loading if this is a forced refresh (user initiated)
    if (force) setLoading(true);
    
    try {
      const newPreferences = await getPreferences();
      prefCache.lastFetch = now;
      
      // Only update state if preferences have changed to avoid unnecessary renders
      if (newPreferences.fontStyle !== preferences.fontStyle) {
        setPreferences(newPreferences);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error refreshing preferences:', error);
      setLoading(false);
    }
  }, [preferences]);
  
  // Load preferences on initial render
  useEffect(() => {
    refreshPreferences();
  }, []);
  
  // Also refresh when the tab becomes visible again after being hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only refresh if it's been at least 5 minutes since last fetch
        const timeSinceLastFetch = Date.now() - prefCache.lastFetch;
        if (timeSinceLastFetch > 5 * 60 * 1000) {
          console.log('Tab visible again, checking for preference updates...');
          refreshPreferences();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshPreferences]);
  
  return (
    <PreferencesContext.Provider value={{ 
      preferences, 
      loading,
      refreshPreferences
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferencesContext = () => useContext(PreferencesContext);