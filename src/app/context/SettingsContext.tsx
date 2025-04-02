// In src/app/context/SettingsContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSettings } from '../hooks/blogService';

type Settings = {
  fontStyle: string;
};

const SettingsContext = createContext<{
  settings: Settings;
  loading: boolean;
}>({
  settings: { fontStyle: 'serif' },
  loading: true,
});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({ fontStyle: 'serif' });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadSettings() {
      const fetchedSettings = await getSettings();
      setSettings(fetchedSettings);
      setLoading(false);
    }
    
    loadSettings();
  }, []);
  
  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);