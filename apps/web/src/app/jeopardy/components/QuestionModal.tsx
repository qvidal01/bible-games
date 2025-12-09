'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { Question, Player } from '../types/game';
import Timer from './Timer';
import { playFeedback, playDramaticBuzz } from '../lib/sounds';
import { useTimerDuration, useSoundEnabled } from '../lib/gameStore';

interface QuestionModalProps {
  question: Question;
  buzzedPlayer: Player | null;
  isHost: boolean;
  showAnswer: boolean;
  onBuzz: () => void;
  onJudge: (correct: boolean) => void;
  onRevealAnswer: () => void;
  onClose: () => void;
  canBuzz: boolean;
  playerId: string;
  buzzOrder?: { playerId: string; time: number }[];
  players?: Player[];
  wrongAnswerers?: string[]; // Players who already answered wrong on this question
}

export default function QuestionModal({
  question,
  buzzedPlayer,
  isHost,
  showAnswer,
  onBuzz,
  onJudge,
  onRevealAnswer,
  onClose,
  canBuzz,
  playerId,
  buzzOrder = [],
  players = [],
  wrongAnswerers = [],
}: QuestionModalProps) {
  // Check if current player already answered wrong on this question
  const hasAnsweredWrong = wrongAnswerers.includes(playerId);
  const effectiveCanBuzz = canBuzz && !hasAnsweredWrong;
  const isCurrentBuzzer = buzzedPlayer?.id === playerId;
  const timerDuration = useTimerDuration();
  const soundEnabled = useSoundEnabled();

  // State for dramatic buzz overlay
  const [showBuzzOverlay, setShowBuzzOverlay] = useState(false);
  const previousBuzzedPlayer = useRef<Player | null>(null);

  // Show dramatic overlay when someone buzzes
  useEffect(() => {
    if (buzzedPlayer && buzzedPlayer.id !== previousBuzzedPlayer.current?.id) {
      setShowBuzzOverlay(true);
      previousBuzzedPlayer.current = buzzedPlayer;

      // Hide overlay after 2 seconds
      const timer = setTimeout(() => {
        setShowBuzzOverlay(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [buzzedPlayer]);

  // Keyboard navigation - Spacebar to buzz
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && effectiveCanBuzz && !buzzedPlayer && !isHost) {
        e.preventDefault();
        handleBuzz();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [effectiveCanBuzz, buzzedPlayer, isHost]);

  const handleBuzz = useCallback(() => {
    if (soundEnabled) {
      playDramaticBuzz();
    }
    onBuzz();
  }, [onBuzz, soundEnabled]);

  const handleJudge = useCallback((correct: boolean) => {
    if (soundEnabled) {
      playFeedback(correct ? 'correct' : 'wrong', correct ? 50 : 100);
    }
    onJudge(correct);
  }, [onJudge, soundEnabled]);

  const handleTimeout = useCallback(() => {
    if (buzzedPlayer) {
      // Time's up - mark as wrong
      handleJudge(false);
    }
  }, [buzzedPlayer, handleJudge]);

  // Calculate buzz times relative to first buzzer
  const firstBuzzTime = buzzOrder.length > 0 ? buzzOrder[0].time : 0;

  return (
    <>
      {/* Full-screen dramatic buzz overlay */}
      {showBuzzOverlay && buzzedPlayer && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          role="alert"
          aria-live="assertive"
        >
          {/* Animated background flashes */}
          <div className="absolute inset-0 animate-buzz-flash" />

          {/* Main content */}
          <div className="relative text-center animate-buzz-scale">
            {/* Glowing ring effect */}
            <div className="absolute inset-0 -m-8 rounded-full bg-yellow-400/30 blur-3xl animate-pulse" />

            {/* Player name */}
            <div className="relative">
              <p className="text-2xl md:text-3xl text-yellow-400 font-bold mb-2 animate-bounce">
                🔔 BUZZED IN! 🔔
              </p>
              <h2 className="text-6xl md:text-8xl lg:text-9xl font-black text-white
                           drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]
                           animate-pulse">
                {buzzedPlayer.name.toUpperCase()}
              </h2>
              <div className="mt-4 flex justify-center gap-2">
                <span className="text-4xl animate-bounce" style={{ animationDelay: '0ms' }}>⚡</span>
                <span className="text-4xl animate-bounce" style={{ animationDelay: '100ms' }}>⚡</span>
                <span className="text-4xl animate-bounce" style={{ animationDelay: '200ms' }}>⚡</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-title"
      >
      <div className="bg-blue-900 rounded-2xl max-w-4xl w-full shadow-2xl border-4 border-yellow-500 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-800 px-6 py-4 flex justify-between items-center">
          <span id="question-title" className="text-yellow-400 font-bold text-xl">
            {question.category} - ${question.value}
            {question.isDailyDouble && (
              <span className="ml-2 bg-yellow-500 text-blue-900 px-2 py-1 rounded text-sm animate-pulse">
                DAILY DOUBLE!
              </span>
            )}
          </span>
          {isHost && (
            <button
              onClick={onClose}
              className="text-white hover:text-red-400 transition-colors"
              aria-label="Close question"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Question */}
        <div className="p-8 md:p-12">
          <p className="text-2xl md:text-4xl text-white text-center font-medium leading-relaxed">
            {question.question}
          </p>
        </div>

        {/* Answer Timer - shows when someone has buzzed */}
        {buzzedPlayer && !showAnswer && (
          <div className="px-8 pb-4">
            <Timer
              duration={timerDuration}
              onTimeout={handleTimeout}
              isActive={true}
              showWarning={true}
            />
          </div>
        )}

        {/* Buzzed Player Display */}
        {buzzedPlayer && (
          <div className="px-8 pb-4">
            <div
              className={`text-center p-4 rounded-lg ${isCurrentBuzzer ? 'bg-green-600' : 'bg-yellow-600'}`}
              role="status"
              aria-live="polite"
            >
              <p className="text-xl font-bold text-white">
                {buzzedPlayer.name} buzzed in!
              </p>
            </div>
          </div>
        )}

        {/* Buzz Order Display (for host) */}
        {isHost && buzzOrder.length > 1 && (
          <div className="px-8 pb-4">
            <p className="text-blue-300 text-sm mb-2">Buzz order:</p>
            <div className="flex flex-wrap gap-2">
              {buzzOrder.map((buzz, index) => {
                const player = players.find(p => p.id === buzz.playerId);
                const timeDiff = buzz.time - firstBuzzTime;
                return (
                  <span
                    key={buzz.playerId}
                    className={`px-3 py-1 rounded-full text-sm ${
                      index === 0
                        ? 'bg-yellow-500 text-blue-900 font-bold'
                        : 'bg-blue-800 text-blue-300'
                    }`}
                  >
                    {index + 1}. {player?.name || 'Unknown'}
                    {index > 0 && ` (+${timeDiff}ms)`}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Answer (when revealed) */}
        {showAnswer && (
          <div className="px-8 pb-4">
            <div className="bg-green-800/50 border-2 border-green-500 rounded-lg p-6">
              <p className="text-xl md:text-2xl text-green-300 text-center font-medium">
                {question.answer}
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="px-8 pb-8">
          {/* Player Buzz Button */}
          {!isHost && !buzzedPlayer && effectiveCanBuzz && (
            <div>
              <button
                onClick={handleBuzz}
                className="w-full py-6 bg-red-600 hover:bg-red-500 text-white text-3xl font-bold rounded-xl
                           transition-all transform hover:scale-105 active:scale-95 shadow-lg animate-pulse
                           focus:outline-none focus:ring-4 focus:ring-red-400"
                aria-label="Buzz in to answer"
              >
                BUZZ IN!
              </button>
              <p className="text-center text-blue-400 text-sm mt-2">
                Press <kbd className="bg-blue-800 px-2 py-1 rounded">Space</kbd> to buzz
              </p>
            </div>
          )}

          {/* Player already answered wrong - can't buzz again */}
          {!isHost && !buzzedPlayer && hasAnsweredWrong && (
            <p className="text-center text-yellow-400 text-xl" role="status">
              You already answered this question
            </p>
          )}

          {/* Waiting for buzz */}
          {!isHost && !buzzedPlayer && !canBuzz && !hasAnsweredWrong && (
            <p className="text-center text-blue-300 text-xl" role="status">
              Waiting for host to enable buzzer...
            </p>
          )}

          {/* Player buzzed - waiting for judgment */}
          {!isHost && buzzedPlayer && !showAnswer && (
            <p className="text-center text-blue-300 text-xl" role="status">
              {isCurrentBuzzer ? "Your turn to answer!" : `${buzzedPlayer.name} is answering...`}
            </p>
          )}

          {/* Host Controls */}
          {isHost && (
            <div className="space-y-4">
              {/* Judging buttons when someone buzzed */}
              {buzzedPlayer && !showAnswer && (
                <div className="flex gap-4">
                  <button
                    onClick={() => handleJudge(true)}
                    className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded-xl transition-colors
                               focus:outline-none focus:ring-4 focus:ring-green-400"
                    aria-label={`Mark ${buzzedPlayer.name}'s answer as correct, adding $${question.value}`}
                  >
                    Correct (+${question.value})
                  </button>
                  <button
                    onClick={() => handleJudge(false)}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-bold rounded-xl transition-colors
                               focus:outline-none focus:ring-4 focus:ring-red-400"
                    aria-label={`Mark ${buzzedPlayer.name}'s answer as wrong, subtracting $${question.value}`}
                  >
                    Wrong (-${question.value})
                  </button>
                </div>
              )}

              {/* Reveal answer button */}
              {!showAnswer && (
                <button
                  onClick={onRevealAnswer}
                  className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl transition-colors
                             focus:outline-none focus:ring-4 focus:ring-blue-400"
                >
                  Reveal Answer
                </button>
              )}

              {/* No one buzzed - just close and return to board */}
              {showAnswer && !buzzedPlayer && (
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-blue-900 text-xl font-bold rounded-xl transition-colors
                             focus:outline-none focus:ring-4 focus:ring-yellow-300"
                >
                  Back to Board
                </button>
              )}

              {/* Judging buttons after answer revealed with a buzzer */}
              {showAnswer && buzzedPlayer && (
                <div className="space-y-3">
                  <p className="text-center text-blue-300 text-sm">Did {buzzedPlayer.name} get it right?</p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleJudge(true)}
                      className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded-xl transition-colors
                                 focus:outline-none focus:ring-4 focus:ring-green-400"
                      aria-label={`Mark ${buzzedPlayer.name}'s answer as correct, adding $${question.value}`}
                    >
                      Correct (+${question.value})
                    </button>
                    <button
                      onClick={() => handleJudge(false)}
                      className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-bold rounded-xl transition-colors
                                 focus:outline-none focus:ring-4 focus:ring-red-400"
                      aria-label={`Mark ${buzzedPlayer.name}'s answer as wrong, subtracting $${question.value}`}
                    >
                      Wrong (-${question.value})
                    </button>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl transition-colors
                               focus:outline-none focus:ring-4 focus:ring-blue-400"
                  >
                    Skip (no points)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
