import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { App as CapApp } from '@capacitor/app';
import Home from './Home';
import Editor from './Editor';
import db from './db';

function BackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let backListener;

    const initListener = async () => {
      backListener = await CapApp.addListener('backButton', (data) => {
        if (location.pathname === '/') {
          CapApp.exitApp();
        } else {
          navigate('/');
        }
      });
    };

    initListener();

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, [location, navigate]);

  return null;
}

function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [globalAccent, setGlobalAccent] = useState('#000000');
  const [preferences, setPreferences] = useState({
    staggeredEntry: true,
    paperSlide: true,
    focusBlur: false,
    elasticMorph: true,
    scrollProgress: true,
    inkBleed: true,
    caretType: 'line'
  });

  useEffect(() => {
    const initApp = async () => {
      await db.init();
      await db.migrateFromLocalStorage();
      
      const theme = await db.getPreference('mdnotes_theme', 'light');
      const accent = await db.getPreference('mdnotes_global_accent', '#000000');
      const prefsJson = await db.getPreference('mdnotes_preferences', null);
      
      setCurrentTheme(theme);
      setGlobalAccent(accent);
      if (prefsJson) {
        try {
          const parsed = JSON.parse(prefsJson);
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to parse preferences:', e);
        }
      }
      
      setIsDbReady(true);
    };

    initApp();
  }, []);

  useEffect(() => {
    if (isDbReady) {
      db.setPreference('mdnotes_preferences', JSON.stringify(preferences));
    }
  }, [preferences, isDbReady]);

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };


  useEffect(() => {
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    if (isDbReady) {
      db.setPreference('mdnotes_theme', currentTheme);
    }
  }, [currentTheme, isDbReady]);

  useEffect(() => {
    const root = document.documentElement;
    if (currentTheme === 'light') {
      root.style.setProperty('--accent-color', globalAccent);
      const r = parseInt(globalAccent.slice(1, 3), 16);
      const g = parseInt(globalAccent.slice(3, 5), 16);
      const b = parseInt(globalAccent.slice(5, 7), 16);
      root.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
    } else {
      root.style.removeProperty('--accent-color');
      root.style.removeProperty('--accent-color-rgb');
    }
    if (isDbReady) {
      db.setPreference('mdnotes_global_accent', globalAccent);
    }
  }, [globalAccent, currentTheme, isDbReady]);



  const toggleTheme = () => {
    setCurrentTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const updateGlobalAccent = (color) => {
    setGlobalAccent(color);
  };



  if (!isDbReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f4f4f0] dark:bg-[#111]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin" />
          <p className="font-serif italic text-[#666] dark:text-[#999]">Waking up the library...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <BackButtonHandler />
      <Routes>
        <Route path="/" element={<Home currentTheme={currentTheme} onToggleTheme={toggleTheme} globalAccent={globalAccent} onUpdateAccent={updateGlobalAccent} preferences={preferences} onUpdatePreference={updatePreference} />} />
        <Route path="/editor" element={<Editor currentTheme={currentTheme} onToggleTheme={toggleTheme} globalAccent={globalAccent} onUpdateAccent={updateGlobalAccent} preferences={preferences} onUpdatePreference={updatePreference} />} />
        <Route path="/editor/:id" element={<Editor currentTheme={currentTheme} onToggleTheme={toggleTheme} globalAccent={globalAccent} onUpdateAccent={updateGlobalAccent} preferences={preferences} onUpdatePreference={updatePreference} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;