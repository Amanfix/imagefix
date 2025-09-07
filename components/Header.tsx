
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-brand-purple" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm3.822 6.587c.22-.22.22-.578 0-.799a.565.565 0 0 0-.8 0l-5.61 5.61c-.22.22-.22.578 0 .799.221.22.579.22.8 0l5.61-5.61zm-5.61 0c.22-.22.578-.22.8 0l5.61 5.61c.22.22.22.578 0 .799a.565.565 0 0 1-.8 0l-5.61-5.61c-.22-.22-.22-.578 0-.799zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/>
        </svg>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Imagfix AI Photo Studio
        </h1>
      </div>
    </header>
  );
};

export default Header;