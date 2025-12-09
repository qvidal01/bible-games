'use client';

import { useEffect, useState } from 'react';

interface BuzzNotificationProps {
  playerName: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export default function BuzzNotification({
  playerName,
  onDismiss,
  autoDismissMs = 5000,
}: BuzzNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after timeout
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for fade out animation
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    >
      <div className="bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 p-1 rounded-2xl shadow-2xl animate-pulse">
        <div className="bg-blue-900 rounded-xl px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Buzzer Icon */}
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center animate-bounce">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>

            {/* Player Info */}
            <div className="text-center">
              <p className="text-yellow-400 text-sm font-semibold uppercase tracking-wider">
                Buzzed First!
              </p>
              <p className="text-white text-3xl font-bold">
                {playerName}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="ml-4 p-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
              aria-label="Dismiss notification"
            >
              <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
