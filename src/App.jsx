import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Editor from './Editor';

function App() {
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('mdnotes_theme') || 'light');
  const [globalAccent, setGlobalAccent] = useState(localStorage.getItem('mdnotes_global_accent') || '#000000');
  const [globalTextSize, setGlobalTextSize] = useState(() => {
    const saved = localStorage.getItem('mdnotes_text_size');
    const parsed = parseInt(saved);
    return isNaN(parsed) ? 100 : parsed;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    localStorage.setItem('mdnotes_theme', currentTheme);
  }, [currentTheme]);

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
    localStorage.setItem('mdnotes_global_accent', globalAccent);
  }, [globalAccent, currentTheme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--base-font-size', `${globalTextSize}%`);
    localStorage.setItem('mdnotes_text_size', globalTextSize.toString());
  }, [globalTextSize]);

  const toggleTheme = () => {
    setCurrentTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const updateGlobalAccent = (color) => {
    setGlobalAccent(color);
  };

  const updateGlobalTextSize = (size) => {
    setGlobalTextSize(size);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home currentTheme={currentTheme} onToggleTheme={toggleTheme} globalAccent={globalAccent} onUpdateAccent={updateGlobalAccent} globalTextSize={globalTextSize} onUpdateTextSize={updateGlobalTextSize} />} />
        <Route path="/editor" element={<Editor currentTheme={currentTheme} onToggleTheme={toggleTheme} globalAccent={globalAccent} onUpdateAccent={updateGlobalAccent} globalTextSize={globalTextSize} onUpdateTextSize={updateGlobalTextSize} />} />
        <Route path="/editor/:id" element={<Editor currentTheme={currentTheme} onToggleTheme={toggleTheme} globalAccent={globalAccent} onUpdateAccent={updateGlobalAccent} globalTextSize={globalTextSize} onUpdateTextSize={updateGlobalTextSize} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;