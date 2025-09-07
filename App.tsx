import React, { useState, useEffect } from 'react';
import type { AppMode, Theme } from './types';
import Header from './components/Header';
import Tabs from './components/Tabs';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import BackgroundRemover from './components/BackgroundRemover';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('generator');
  
  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Effect to update the DOM and localStorage when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-sans transition-colors duration-300">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="container mx-auto px-4 py-8">
        <Tabs activeTab={mode} setActiveTab={setMode} />
        <div className="mt-8">
          {mode === 'generator' && <ImageGenerator />}
          {mode === 'editor' && <ImageEditor />}
          {mode === 'remover' && <BackgroundRemover />}
        </div>
      </main>
    </div>
  );
};

export default App;