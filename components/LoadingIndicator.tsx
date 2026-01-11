import React from 'react';
interface LoadingIndicatorProps {
  message?: string;
  subMessage?: string;
}
export function LoadingIndicator({
  message = "Loading...",
  subMessage = "Please wait while we prepare your content"
}: LoadingIndicatorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="relative mb-8">
        <div
          className="w-24 h-24 rounded-full animate-spin"
          style={{
            background: 'conic-gradient(from 0deg, transparent, #8b5cf6, #06b6d4, #10b981, transparent)',
            animationDuration: '1.5s'
          }}
        ></div>
        <div
          className="absolute inset-2 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
          }}
        >
          <svg className="w-8 h-8 text-cyan-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
      <div className="text-center">
        <h3
          className="text-2xl font-bold mb-2"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          {message}
        </h3>
        <p
          className="text-violet-300"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {subMessage}
        </p>
      </div>
      <div className="flex gap-2 mt-8">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-full animate-bounce"
            style={{
              background: i % 2 === 0 ? '#8b5cf6' : '#06b6d4',
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.8s'
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}