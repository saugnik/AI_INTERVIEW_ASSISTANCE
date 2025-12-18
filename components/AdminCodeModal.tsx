/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface AdminCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminCode: string;
}

export function AdminCodeModal({ isOpen, onClose, adminCode }: AdminCodeModalProps) {
  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(adminCode);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="relative w-full max-w-md overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
          borderRadius: '24px',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.2)'
        }}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500"></div>
        
        <div className="p-8">
          <div className="text-center mb-6">
            <div 
              className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)'
              }}
            >
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 
              className="text-2xl font-bold mb-2"
              style={{ 
                fontFamily: "'Space Grotesk', sans-serif",
                background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Educator Access Code
            </h2>
            <p className="text-violet-300 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Share this code with educators to grant them admin access
            </p>
          </div>

          <div 
            className="relative p-4 rounded-xl mb-6"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(139, 92, 246, 0.2)'
            }}
          >
            <div className="flex items-center justify-between">
              <code 
                className="text-2xl font-mono tracking-wider text-cyan-400"
                style={{ letterSpacing: '0.2em' }}
              >
                {adminCode}
              </code>
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.3)'
                }}
                title="Copy to clipboard"
              >
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          <div 
            className="p-4 rounded-xl mb-6"
            style={{
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}
          >
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-amber-200 text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>
                Keep this code secure. Anyone with this code can access educator features.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02]"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)'
            }}
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
