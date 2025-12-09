'use client';

import { useState, useEffect } from 'react';
import { Question, Player, DailyDoubleState } from '../types/game';
import Timer from './Timer';
import { playSound } from '../lib/sounds';
import { useTimerDuration, useSoundEnabled } from '../lib/gameStore';

interface DailyDoubleModalProps {
  dailyDouble: DailyDoubleState;
  player: Player;
  isHost: boolean;
  isCurrentPlayer: boolean;
  onSetWager: (wager: number) => void;
  onJudge: (correct: boolean) => void;
  onRevealAnswer: () => void;
  onClose: () => void;
  showAnswer: boolean;
}

export default function DailyDoubleModal({
  dailyDouble,
  player,
  isHost,
  isCurrentPlayer,
  onSetWager,
  onJudge,
  onRevealAnswer,
  onClose,
  showAnswer,
}: DailyDoubleModalProps) {
  const [wagerInput, setWagerInput] = useState('');
  const [wagerError, setWagerError] = useState('');
  const timerDuration = useTimerDuration();
  const soundEnabled = useSoundEnabled();

  // Play Daily Double sound on mount
  useEffect(() => {
    if (soundEnabled) {
      playSound('dailyDouble');
    }
  }, [soundEnabled]);

  const handleWagerSubmit = () => {
    const wager = parseInt(wagerInput, 10);

    if (isNaN(wager) || wager < 5) {
      setWagerError('Minimum wager is $5');
      return;
    }

    if (wager > dailyDouble.maxWager) {
      setWagerError(`Maximum wager is $${dailyDouble.maxWager.toLocaleString()}`);
      return;
    }

    onSetWager(wager);
  };

  const handleTimeout = () => {
    if (dailyDouble.wager !== null && !dailyDouble.answered) {
      onJudge(false);
    }
  };

  // Quick wager buttons
  const quickWagers = [
    { label: 'Min ($5)', value: 5 },
    { label: 'Half', value: Math.floor(dailyDouble.maxWager / 2) },
    { label: 'Max', value: dailyDouble.maxWager },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-double-title"
    >
      <div className="bg-blue-900 rounded-2xl max-w-4xl w-full shadow-2xl border-4 border-yellow-500 overflow-hidden">
        {/* Daily Double Banner */}
        <div className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 px-6 py-6 text-center">
          <h2 id="daily-double-title" className="text-4xl md:text-6xl font-bold text-blue-900 animate-pulse">
            DAILY DOUBLE!
          </h2>
        </div>

        {/* Player Info */}
        <div className="bg-blue-800 px-6 py-4 text-center">
          <p className="text-xl text-white">
            <span className="text-yellow-400 font-bold">{player.name}</span> found the Daily Double!
          </p>
          <p className="text-blue-300 mt-1">
            Current score: <span className={player.score >= 0 ? 'text-green-400' : 'text-red-400'}>
              ${player.score.toLocaleString()}
            </span>
          </p>
        </div>

        {/* Wager Selection Phase */}
        {dailyDouble.wager === null && (
          <div className="p-8">
            <p className="text-white text-xl text-center mb-6">
              Category: <span className="text-yellow-400 font-bold">{dailyDouble.question.category}</span>
            </p>

            {isCurrentPlayer && (
              <div className="space-y-6">
                <p className="text-blue-300 text-center">
                  How much would you like to wager? (Max: ${dailyDouble.maxWager.toLocaleString()})
                </p>

                {/* Quick Wager Buttons */}
                <div className="flex justify-center gap-4">
                  {quickWagers.map((qw) => (
                    <button
                      key={qw.label}
                      onClick={() => setWagerInput(qw.value.toString())}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors"
                    >
                      {qw.label}
                    </button>
                  ))}
                </div>

                {/* Wager Input */}
                <div className="flex gap-4 max-w-md mx-auto">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={wagerInput}
                      onChange={(e) => {
                        setWagerInput(e.target.value);
                        setWagerError('');
                      }}
                      placeholder="Enter wager amount"
                      className="w-full px-4 py-3 rounded-lg bg-blue-800 border border-blue-600 text-white text-xl text-center
                                 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      min={5}
                      max={dailyDouble.maxWager}
                      aria-label="Wager amount"
                    />
                    {wagerError && (
                      <p className="text-red-400 text-sm mt-2 text-center">{wagerError}</p>
                    )}
                  </div>
                  <button
                    onClick={handleWagerSubmit}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold rounded-lg transition-colors"
                  >
                    Lock In
                  </button>
                </div>
              </div>
            )}

            {!isCurrentPlayer && (
              <p className="text-center text-blue-300 text-xl animate-pulse">
                Waiting for {player.name} to set their wager...
              </p>
            )}
          </div>
        )}

        {/* Question Phase */}
        {dailyDouble.wager !== null && (
          <div className="p-8">
            {/* Wager Display */}
            <div className="text-center mb-6">
              <p className="text-blue-300">
                Wagering: <span className="text-yellow-400 font-bold text-2xl">${dailyDouble.wager.toLocaleString()}</span>
              </p>
            </div>

            {/* Question */}
            <p className="text-2xl md:text-4xl text-white text-center font-medium leading-relaxed mb-8">
              {dailyDouble.question.question}
            </p>

            {/* Timer */}
            {!dailyDouble.answered && !showAnswer && (
              <Timer
                duration={timerDuration}
                onTimeout={handleTimeout}
                isActive={true}
                showWarning={true}
                className="mb-6"
              />
            )}

            {/* Answer (when revealed) */}
            {showAnswer && (
              <div className="mb-6">
                <div className="bg-green-800/50 border-2 border-green-500 rounded-lg p-6">
                  <p className="text-xl md:text-2xl text-green-300 text-center font-medium">
                    {dailyDouble.question.answer}
                  </p>
                </div>
              </div>
            )}

            {/* Host Controls */}
            {isHost && !dailyDouble.answered && (
              <div className="space-y-4">
                {!showAnswer && (
                  <>
                    <div className="flex gap-4">
                      <button
                        onClick={() => onJudge(true)}
                        className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-bold rounded-xl transition-colors"
                      >
                        Correct (+${dailyDouble.wager.toLocaleString()})
                      </button>
                      <button
                        onClick={() => onJudge(false)}
                        className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white text-xl font-bold rounded-xl transition-colors"
                      >
                        Wrong (-${dailyDouble.wager.toLocaleString()})
                      </button>
                    </div>
                    <button
                      onClick={onRevealAnswer}
                      className="w-full py-3 bg-blue-700 hover:bg-blue-600 text-white text-lg font-semibold rounded-xl transition-colors"
                    >
                      Reveal Answer
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Result display */}
            {dailyDouble.answered && (
              <div className="text-center">
                <button
                  onClick={onClose}
                  className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-blue-900 text-xl font-bold rounded-xl transition-colors"
                >
                  Back to Board
                </button>
              </div>
            )}

            {/* Player waiting */}
            {!isHost && !dailyDouble.answered && (
              <p className="text-center text-blue-300 text-xl">
                {isCurrentPlayer ? "Answer out loud! The host will judge." : `${player.name} is answering...`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
