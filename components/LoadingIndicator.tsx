
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Consulting the tech elders...",
  "Compiling difficult edge cases...",
  "Reviewing system architecture patterns...",
  "Optimizing for time complexity...",
  "Generating hidden test cases...",
  "Analyzing algorithm efficiency...",
  "Fetching data from the neural network...",
  "Preparing the whiteboard...",
  "Simulating interview pressure..."
];

const LoadingIndicator: React.FC<{message?: string}> = ({message}) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-12 animate-in fade-in duration-500">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
      <h2 className="text-xl font-semibold mt-8 text-slate-800 dark:text-slate-200">
        {message || "Processing"}
      </h2>
      <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingIndicator;
