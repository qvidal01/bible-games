'use client';

import { useEffect, useState, useRef } from 'react';
import { SurveyQuestion } from '../types/game';
import { playSound, vibrate } from '@shared/lib/sounds';

interface SurveyBoardProps {
  question: SurveyQuestion;
  onRevealAnswer?: (answerId: string) => void;
  isHost: boolean;
  showQuestion: boolean;
}

export default function SurveyBoard({
  question,
  onRevealAnswer,
  isHost,
  showQuestion,
}: SurveyBoardProps) {
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const prevRevealedIds = useRef<Set<string>>(new Set());

  // Sort answers by rank
  const sortedAnswers = [...question.answers].sort((a, b) => a.rank - b.rank);

  // Track newly revealed answers and play sound
  useEffect(() => {
    const newlyRevealed = sortedAnswers.find(
      a => a.revealed && !prevRevealedIds.current.has(a.id)
    );

    if (newlyRevealed) {
      playSound('reveal');
      vibrate(50);
      setRevealingId(newlyRevealed.id);

      // Clear animation after delay
      const timer = setTimeout(() => {
        setRevealingId(null);
      }, 1000);

      // Update tracked IDs
      prevRevealedIds.current.add(newlyRevealed.id);

      return () => clearTimeout(timer);
    }
  }, [sortedAnswers]);

  // Reset tracking when question changes
  useEffect(() => {
    prevRevealedIds.current = new Set(
      question.answers.filter(a => a.revealed).map(a => a.id)
    );
  }, [question.id]);

  const handleReveal = (answerId: string) => {
    if (isHost && onRevealAnswer) {
      playSound('select');
      onRevealAnswer(answerId);
    }
  };

  // Calculate revealed points
  const revealedPoints = sortedAnswers
    .filter(a => a.revealed)
    .reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Question */}
      {showQuestion && (
        <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-800 rounded-xl p-6 mb-6 text-center border-4 border-yellow-500 shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/10 to-transparent animate-pulse" />
          <p className="text-xl md:text-2xl text-white font-bold relative z-10">
            {question.question}
          </p>
          <p className="text-red-300 text-sm mt-2 relative z-10">
            {sortedAnswers.filter(a => a.revealed).length} of {question.answers.length} answers revealed
          </p>
        </div>
      )}

      {/* Answer Board */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-950 rounded-2xl p-4 md:p-6 border-4 border-yellow-500 shadow-2xl">
        <div className="space-y-2">
          {sortedAnswers.map((answer) => {
            const isRevealing = revealingId === answer.id;

            return (
              <div
                key={answer.id}
                onClick={() => !answer.revealed && handleReveal(answer.id)}
                className={`
                  flex items-center justify-between rounded-lg p-3 md:p-4 transition-all duration-300
                  ${answer.revealed
                    ? isRevealing
                      ? 'bg-green-600 scale-105 shadow-lg shadow-green-500/50'
                      : 'bg-blue-600'
                    : isHost
                      ? 'bg-blue-800 hover:bg-blue-700 hover:scale-[1.02] cursor-pointer'
                      : 'bg-blue-800'
                  }
                `}
              >
                {/* Answer Number */}
                <div className="flex items-center gap-4">
                  <span className={`
                    w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-bold text-lg md:text-xl rounded-full transition-all
                    ${answer.revealed
                      ? 'bg-yellow-400 text-blue-900'
                      : 'bg-yellow-600 text-blue-900'
                    }
                    ${isRevealing ? 'animate-bounce' : ''}
                  `}>
                    {answer.rank}
                  </span>

                  {/* Answer Text or Placeholder */}
                  <span className={`
                    text-lg md:text-xl font-bold transition-all
                    ${answer.revealed
                      ? isRevealing ? 'text-yellow-300 scale-105' : 'text-white'
                      : 'text-blue-600'
                    }
                  `}>
                    {answer.revealed ? answer.text.toUpperCase() : '━━━━━━━━━━'}
                  </span>
                </div>

                {/* Points */}
                <div className={`
                  min-w-[60px] md:min-w-[80px] text-center py-1 px-2 md:px-4 rounded-lg font-bold text-lg md:text-xl transition-all
                  ${answer.revealed
                    ? isRevealing
                      ? 'bg-yellow-300 text-blue-900 scale-110'
                      : 'bg-yellow-500 text-blue-900'
                    : 'bg-blue-700 text-blue-500'
                  }
                `}>
                  {answer.revealed ? answer.points : '??'}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Points */}
        <div className="mt-4 pt-4 border-t-2 border-blue-700 flex justify-between items-center">
          <span className="text-blue-300 font-bold text-lg">Points Revealed:</span>
          <div className="flex items-center gap-3">
            <span className="text-green-400 font-bold text-xl">
              {revealedPoints}
            </span>
            <span className="text-blue-400">/</span>
            <span className="text-yellow-400 font-bold text-xl">
              {question.totalPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Host Instructions */}
      {isHost && (
        <p className="text-center text-red-300 mt-4 text-sm">
          {sortedAnswers.every(a => a.revealed)
            ? 'All answers revealed!'
            : 'Tap an answer to reveal it'}
        </p>
      )}
    </div>
  );
}
