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

      const seedTutorials = async () => {
        const docs = await db.getDocs();
        if (docs.length === 0) {
          // 1. Markdown Tutorial
          await db.saveDoc({
            id: 'tutorial-md',
            title: 'Markdown Essentials',
            type: 'markdown',
            lastModified: Date.now(),
            content: String.raw`# Welcome to MD-Notes
A beautifully crafted, **distraction-free** Markdown workspace.

## Features
- **Visual Editing**: Write naturally, just like in Word.
- **Visual Assets**: Add images with captions.
![Nature](https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=2070)
*Capturing beauty in every pixel.*


- **Mathematics**: Full LaTeX support via KaTeX.
$$
E = mc^2
$$

> "The palest ink is better than the best memory."`
          });

          await db.saveDoc({
            id: 'tutorial-latex',
            title: 'Mathematical Formulas',
            type: 'markdown',
            lastModified: Date.now() - 500,
            content: String.raw`# LaTeX in MD-Notes
The editor supports high-performance mathematical typesetting using KaTeX.

## Inline Math
You can include formulas within your text, like $a^2 + b^2 = c^2$, by wrapping them in single dollar signs.

## Block Math
For more complex equations, use double dollar signs:

$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$

$$
\int_{a}^{b} x^2 dx = \left[ \frac{x^3}{3} \right]_{a}^{b}
$$
`
          });

          // 2. Free Mode Tutorial
          const freeModeData = {
            mainContent: String.raw`# Free Mode Masterclass
Explore the creative canvas.`,
            isFreeMode: true,
            elements: [
              {
                id: 't1',
                type: 'text',
                x: 15,
                y: 50,
                width: 320,
                height: 180,
                rotation: -3,
                content: '<h1>Creative Canvas</h1><p>Welcome to <b>Free Mode</b>. Here, your notes aren\'t just text—they are objects. Try dragging this box or rotating it using the handle at the top!</p>'
              },
              {
                id: 't2',
                type: 'image',
                x: 165,
                y: 220,
                width: 200,
                height: 180,
                rotation: 4,
                src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=2000'
              },
              {
                id: 't3',
                type: 'text',
                x: 15,
                y: 420,
                width: 340,
                height: 160,
                rotation: 0,
                content: '<h3>Smart Wrapping</h3><p>Notice how this text <i>flows</i> around the camera image? Just move an image over a text box to activate the automatic text-wrapping engine.</p>'
              }
            ]
          };

          await db.saveDoc({
            id: 'tutorial-free',
            title: 'Free Mode Masterclass',
            type: 'plain',
            lastModified: Date.now() - 1000, // Older so it shows up after
            content: JSON.stringify(freeModeData)
          });
        }
      };

      await seedTutorials();
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