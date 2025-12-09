'use client';

import { useEffect, useState } from 'react';
import { playSound, vibrate } from '@shared/lib/sounds';

interface StrikeDisplayProps {
  strikes: number;
  maxStrikes?: number;
  showAnimation?: boolean;
  playStrikeSound?: boolean;
}

export default function StrikeDisplay({
  strikes,
  maxStrikes = 3,
  showAnimation = false,
  playStrikeSound = true,
}: StrikeDisplayProps) {
  const [animatingStrike, setAnimatingStrike] = useState<number | null>(null);
  const [prevStrikes, setPrevStrikes] = useState(strikes);

  // Play sound and animate when strikes increase
  useEffect(() => {
    if (strikes > prevStrikes && playStrikeSound) {
      playSound('strike');
      vibrate(100);
      setAnimatingStrike(strikes - 1);

      // Clear animation after delay
      const timer = setTimeout(() => {
        setAnimatingStrike(null);
      }, 1000);

      return () => clearTimeout(timer);
    }
    setPrevStrikes(strikes);
  }, [strikes, prevStrikes, playStrikeSound]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-center gap-4">
        {Array.from({ length: maxStrikes }).map((_, index) => {
          const isActive = index < strikes;
          const isNewStrike = animatingStrike === index;

          return (
            <div
              key={index}
              className={`
                w-20 h-20 md:w-24 md:h-24 flex items-center justify-center
                rounded-xl border-4 transition-all duration-300
                ${isActive
                  ? 'bg-red-600 border-red-400 shadow-lg shadow-red-500/50'
                  : 'bg-gray-800/50 border-gray-600'
                }
                ${isNewStrike ? 'animate-bounce scale-125' : ''}
                ${showAnimation && isActive && !isNewStrike ? 'animate-pulse' : ''}
              `}
            >
              <svg
                className={`
                  w-12 h-12 md:w-14 md:h-14 transition-all duration-300
                  ${isActive ? 'text-white' : 'text-gray-600/50'}
                  ${isNewStrike ? 'scale-110' : ''}
                `}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isActive ? 5 : 3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Strike text indicator */}
      {strikes > 0 && (
        <p className={`
          text-red-400 font-bold text-lg uppercase tracking-wider
          ${animatingStrike !== null ? 'animate-pulse' : ''}
        `}>
          {strikes === maxStrikes ? 'THREE STRIKES!' : `Strike ${strikes}!`}
        </p>
      )}
    </div>
  );
}
