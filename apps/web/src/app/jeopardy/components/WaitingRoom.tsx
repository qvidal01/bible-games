'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from '@shared/components/LoadingSpinner';

interface WaitingRoomProps {
  position: number;
  reason: string;
  onRetry: () => void;
  onCancel: () => void;
  roomCode?: string;
}

export default function WaitingRoom({
  position,
  reason,
  onRetry,
  onCancel,
  roomCode,
}: WaitingRoomProps) {
  const [currentPosition, setCurrentPosition] = useState(position);
  const [checkingSlot, setCheckingSlot] = useState(false);
  const [timeWaiting, setTimeWaiting] = useState(0);

  // Auto-check for available slots every 10 seconds
  useEffect(() => {
    const checkInterval = setInterval(async () => {
      setCheckingSlot(true);
      try {
        const res = await fetch('/api/connections/status');
        const data = await res.json();

        if (!data.isAtCapacity) {
          // Slot available! Try to connect
          onRetry();
        } else {
          // Update position estimate
          setCurrentPosition(Math.max(1, data.totalConnections - 90 + position));
        }
      } catch (error) {
        console.error('Failed to check slot:', error);
      }
      setCheckingSlot(false);
    }, 10000);

    return () => clearInterval(checkInterval);
  }, [position, onRetry]);

  // Track waiting time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeWaiting((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-blue-800/50 border border-blue-600 rounded-2xl p-8 max-w-md w-full text-center">
        {/* Waiting Animation */}
        <div className="mb-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-yellow-400/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-yellow-400">#{currentPosition}</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-yellow-400 mb-2">
          Waiting Room
        </h2>

        <p className="text-blue-200 mb-4">
          {reason}
        </p>

        {roomCode && (
          <p className="text-sm text-blue-300 mb-4">
            Trying to join room: <span className="font-mono font-bold">{roomCode}</span>
          </p>
        )}

        {/* Position Info */}
        <div className="bg-blue-900/50 rounded-lg p-4 mb-6">
          <div className="flex justify-between text-sm text-blue-300 mb-2">
            <span>Your position:</span>
            <span className="font-bold text-white">#{currentPosition} in queue</span>
          </div>
          <div className="flex justify-between text-sm text-blue-300 mb-2">
            <span>Time waiting:</span>
            <span className="font-bold text-white">{formatTime(timeWaiting)}</span>
          </div>
          <div className="flex justify-between text-sm text-blue-300">
            <span>Status:</span>
            <span className="font-bold text-yellow-400">
              {checkingSlot ? 'Checking...' : 'Waiting for slot'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-blue-400 mb-1">
            <span>Auto-checking every 10 seconds</span>
            {checkingSlot && <LoadingSpinner size="sm" />}
          </div>
          <div className="h-2 bg-blue-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-1000"
              style={{ width: `${((timeWaiting % 10) / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-900/30 rounded-lg p-3 mb-6 text-left">
          <p className="text-xs text-blue-400 font-semibold mb-1">💡 Tips while you wait:</p>
          <ul className="text-xs text-blue-300 space-y-1">
            <li>• Games typically last 20-30 minutes</li>
            <li>• Peak hours are evenings and weekends</li>
            <li>• You&apos;ll auto-connect when a spot opens</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onRetry}
            disabled={checkingSlot}
            className="flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-500/50
                       text-blue-900 font-bold rounded-xl transition-colors"
          >
            {checkingSlot ? 'Checking...' : 'Try Again Now'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 bg-blue-700 hover:bg-blue-600 text-white font-semibold
                       rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Server Status */}
        <p className="mt-4 text-xs text-blue-500">
          Server capacity: 90 players max • Rooms: 15 players each
        </p>
      </div>
    </div>
  );
}
