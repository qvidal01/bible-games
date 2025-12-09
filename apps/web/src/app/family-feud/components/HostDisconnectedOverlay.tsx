'use client';

import { useState, useEffect } from 'react';

interface HostDisconnectedOverlayProps {
  hostName: string;
  disconnectedAt: number;
  timeoutDuration: number; // 5 minutes in ms
  onTimeout: () => void;
  onHostReconnected?: () => void;
}

export default function HostDisconnectedOverlay({
  hostName,
  disconnectedAt,
  timeoutDuration,
  onTimeout,
}: HostDisconnectedOverlayProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeoutDuration);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - disconnectedAt;
      const remaining = Math.max(0, timeoutDuration - elapsed);
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onTimeout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [disconnectedAt, timeoutDuration, onTimeout]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-red-900/90 border-4 border-red-500 rounded-2xl p-8 max-w-md w-full text-center animate-pulse">
        <div className="text-6xl mb-4">
          <span role="img" aria-label="warning">&#x26A0;&#xFE0F;</span>
        </div>

        <h2 className="text-2xl font-bold text-red-200 mb-2">
          Host Disconnected
        </h2>

        <p className="text-red-300 mb-6">
          <strong className="text-white">{hostName}</strong> has lost connection.
          <br />
          Waiting for them to rejoin...
        </p>

        <div className="bg-black/50 rounded-xl p-6 mb-6">
          <p className="text-red-400 text-sm mb-2">Game will end in:</p>
          <div className="text-5xl font-mono font-bold text-white">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </div>
        </div>

        <p className="text-red-400 text-sm">
          The game is paused until the host returns.
          <br />
          If they don&apos;t rejoin in time, the game will end.
        </p>
      </div>
    </div>
  );
}
