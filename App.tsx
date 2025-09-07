import React, { useState } from 'react';
import type { AppMode } from './types';
import Header from './components/Header';
import Tabs from './components/Tabs';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import BackgroundRemover from './components/BackgroundRemover';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('generator');

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header />
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
