import React, { useState, useEffect } from 'react';

interface LoadingIndicatorProps {
  messages: string[];
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ messages }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length > 1) {
      const intervalId = setInterval(() => {
        setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
      }, 3000); // Change message every 3 seconds

      return () => clearInterval(intervalId);
    }
  }, [messages]);

  return (
    <div className="text-center text-gray-600 dark:text-gray-400 p-8 flex flex-col items-center justify-center animate-fade-in">
      {/* A more visually interesting spinner */}
      <svg className="w-16 h-16 animate-spin text-brand-purple" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
         <circle
          className="opacity-25"
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
        />
        <path
          className="opacity-75"
          d="M50,5 A 45,45 0 0 1 95,50"
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <p className="mt-6 text-xl font-semibold transition-opacity duration-500 ease-in-out">
        {messages[currentMessageIndex]}
      </p>
      <p className="mt-2 text-base text-gray-500 dark:text-gray-500">
        This can take a moment, please be patient.
      </p>
    </div>
  );
};

export default LoadingIndicator;