'use client';

import { useEffect, useState, useCallback } from 'react';
import { playSound } from '../lib/sounds';

interface TimerProps {
  duration: number; // in seconds
  onTimeout: () => void;
  isActive: boolean;
  showWarning?: boolean; // Show warning at 10 seconds
  className?: string;
}

export default function Timer({
  duration,
  onTimeout,
  isActive,
  showWarning = true,
  className = '',
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // Reset timer when duration changes or becomes active
  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration);
      setHasTimedOut(false);
    }
  }, [duration, isActive]);

  // Countdown logic
  useEffect(() => {
    if (!isActive || hasTimedOut) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setHasTimedOut(true);
          return 0;
        }
        // Play warning sound at 10 seconds
        if (showWarning && prev === 11) {
          playSound('timer');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, hasTimedOut, showWarning]);

  // Call onTimeout when timer reaches 0
  useEffect(() => {
    if (hasTimedOut && isActive) {
      onTimeout();
    }
  }, [hasTimedOut, isActive, onTimeout]);

  // Calculate progress percentage
  const progress = (timeLeft / duration) * 100;

  // Determine color based on time left
  const getColor = () => {
    if (timeLeft <= 5) return 'text-red-500';
    if (timeLeft <= 10) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getBarColor = () => {
    if (timeLeft <= 5) return 'bg-red-500';
    if (timeLeft <= 10) return 'bg-yellow-400';
    return 'bg-green-400';
  };

  if (!isActive) return null;

  return (
    <div className={`w-full ${className}`} role="timer" aria-live="polite">
      {/* Progress bar */}
      <div className="h-2 bg-blue-900 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${getBarColor()}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Time display */}
      <div className={`text-center font-bold text-2xl ${getColor()} ${timeLeft <= 5 ? 'animate-pulse' : ''}`}>
        {timeLeft}s
      </div>
    </div>
  );
}
