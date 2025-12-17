'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient, getGameChannel, SHARED_EVENTS } from '@shared/lib/pusher';

interface InactivityWarningProps {
  roomCode: string;
  isHost: boolean;
  onDismiss?: () => void;
}

interface WarningData {
  level: 1 | 2;
  message: string;
  minutesRemaining: number;
}

interface TimeoutData {
  reason: 'inactivity' | 'expired';
  message: string;
}

export default function InactivityWarning({ roomCode, isHost, onDismiss }: InactivityWarningProps) {
  const router = useRouter();
  const [warning, setWarning] = useState<WarningData | null>(null);
  const [timeout, setTimeout] = useState<TimeoutData | null>(null);
  const [showWarning, setShowWarning] = useState(false);

  // Dismiss warning on user interaction (activity)
  const handleDismiss = useCallback(() => {
    setShowWarning(false);
    setWarning(null);
    onDismiss?.();
  }, [onDismiss]);

  // Host triggers inactivity check periodically
  useEffect(() => {
    if (!isHost) return;

    const checkInactivity = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_INACTIVITY_CHECK_TOKEN || 'inactivity-check-secret';
        await fetch('/api/game/inactivity-check', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('Inactivity check failed:', error);
      }
    };

    // Check every 60 seconds
    const interval = setInterval(checkInactivity, 60 * 1000);

    // Initial check after 30 seconds
    const initialTimeout = window.setTimeout(checkInactivity, 30 * 1000);

    return () => {
      clearInterval(interval);
      window.clearTimeout(initialTimeout);
    };
  }, [isHost]);

  // Listen for inactivity events from Pusher
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(getGameChannel(roomCode));

    channel.bind(SHARED_EVENTS.INACTIVITY_WARNING, (data: WarningData) => {
      setWarning(data);
      setShowWarning(true);
    });

    channel.bind(SHARED_EVENTS.INACTIVITY_TIMEOUT, (data: TimeoutData) => {
      setTimeout(data);
    });

    channel.bind(SHARED_EVENTS.GAME_ENDED, (data: { reason?: string }) => {
      if (data.reason === 'inactivity' || data.reason === 'expired') {
        router.push('/jeopardy?ended=' + data.reason);
      }
    });

    return () => {
      channel.unbind(SHARED_EVENTS.INACTIVITY_WARNING);
      channel.unbind(SHARED_EVENTS.INACTIVITY_TIMEOUT);
      channel.unbind(SHARED_EVENTS.GAME_ENDED);
    };
  }, [roomCode, router]);

  // Game ended due to timeout
  if (timeout) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
        <div className="bg-red-900 border-2 border-red-500 rounded-xl p-8 max-w-md mx-4 text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold text-white mb-4">Game Ended</h2>
          <p className="text-red-200 mb-6">{timeout.message}</p>
          <button
            onClick={() => router.push('/jeopardy')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Warning overlay
  if (showWarning && warning) {
    const isUrgent = warning.level === 2;

    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] animate-bounce">
        <div
          className={`
            ${isUrgent ? 'bg-red-600 border-red-400' : 'bg-yellow-600 border-yellow-400'}
            border-2 rounded-xl px-6 py-4 shadow-2xl max-w-md
          `}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">
              {isUrgent ? '🚨' : '⚠️'}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold ${isUrgent ? 'text-red-100' : 'text-yellow-100'}`}>
                {isUrgent ? 'Final Warning!' : 'Inactivity Detected'}
              </h3>
              <p className={`text-sm ${isUrgent ? 'text-red-200' : 'text-yellow-200'}`}>
                {warning.message}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className={`
                ${isUrgent ? 'bg-red-700 hover:bg-red-800' : 'bg-yellow-700 hover:bg-yellow-800'}
                text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors
              `}
            >
              I&apos;m Here!
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
