import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Editor from './Editor';

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('mdnotes_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mdnotes_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home currentTheme={theme} onToggleTheme={toggleTheme} />} />
        <Route path="/editor" element={<Editor currentTheme={theme} />} />
        <Route path="/editor/:id" element={<Editor currentTheme={theme} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;