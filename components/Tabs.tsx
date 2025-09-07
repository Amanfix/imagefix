import React from 'react';
import type { AppMode } from '../types';

interface TabsProps {
  activeTab: AppMode;
  setActiveTab: (tab: AppMode) => void;
}

const Tabs: React.FC<TabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: AppMode; label: string }[] = [
    { id: 'generator', label: 'Image Generator' },
    { id: 'editor', label: 'Image Editor' },
    { id: 'remover', label: 'Background Remover' },
  ];

  return (
    <div className="flex justify-center bg-gray-200 dark:bg-gray-800 rounded-lg p-1 max-w-lg mx-auto transition-colors duration-300">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`w-full py-2.5 text-sm font-semibold leading-5 rounded-md transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-opacity-75
            ${
              activeTab === tab.id
                ? 'bg-brand-purple text-white shadow'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-700/50'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;