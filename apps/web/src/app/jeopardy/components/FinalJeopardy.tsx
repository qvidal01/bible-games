'use client';

import { useState, useEffect } from 'react';
import { Player, FinalJeopardyState } from '../types/game';
import Timer from './Timer';
import { playSound } from '../lib/sounds';
import { useSoundEnabled } from '../lib/gameStore';

interface FinalJeopardyProps {
  finalJeopardy: FinalJeopardyState;
  players: Player[];
  currentPlayerId: string;
  isHost: boolean;
  onSetWager: (playerId: string, wager: number) => void;
  onSetAnswer: (playerId: string, answer: string) => void;
  onStartQuestion: () => void;
  onReveal: () => void;
  onJudge: (playerId: string, correct: boolean) => void;
  onFinishGame: () => void;
  status: 'final-jeopardy-wager' | 'final-jeopardy-question' | 'final-jeopardy-reveal';
}

export default function FinalJeopardy({
  finalJeopardy,
  players,
  currentPlayerId,
  isHost,
  onSetWager,
  onSetAnswer,
  onStartQuestion,
  onReveal,
  onJudge,
  onFinishGame,
  status,
}: FinalJeopardyProps) {
  const [wagerInput, setWagerInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [wagerError, setWagerError] = useState('');
  const [judgments, setJudgments] = useState<Record<string, boolean>>({});
  const soundEnabled = useSoundEnabled();

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const hasSubmittedWager = currentPlayerId in finalJeopardy.wagers;
  const hasSubmittedAnswer = currentPlayerId in finalJeopardy.answers;

  // Eligible players (positive score, not spectator)
  const eligiblePlayers = players.filter(p => p.score > 0 && !p.isSpectator);

  // All wagers submitted?
  const allWagersSubmitted = eligiblePlayers.every(p => p.id in finalJeopardy.wagers);

  // All answers submitted?
  const allAnswersSubmitted = eligiblePlayers.every(p => p.id in finalJeopardy.answers);

  // Play Final Jeopardy music on mount
  useEffect(() => {
    if (soundEnabled && status === 'final-jeopardy-question') {
      playSound('finalJeopardy');
    }
  }, [soundEnabled, status]);

  const handleWagerSubmit = () => {
    if (!currentPlayer) return;

    const wager = parseInt(wagerInput, 10);
    const maxWager = currentPlayer.score;

    if (isNaN(wager) || wager < 0) {
      setWagerError('Wager must be a positive number');
      return;
    }

    if (wager > maxWager) {
      setWagerError(`Maximum wager is $${maxWager.toLocaleString()}`);
      return;
    }

    onSetWager(currentPlayerId, wager);
  };

  const handleAnswerSubmit = () => {
    if (answerInput.trim()) {
      onSetAnswer(currentPlayerId, answerInput.trim());
    }
  };

  const handleJudgment = (playerId: string, correct: boolean) => {
    setJudgments(prev => ({ ...prev, [playerId]: correct }));
    onJudge(playerId, correct);
  };

  const allJudged = eligiblePlayers.every(p => p.id in judgments);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Final Jeopardy Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-2"
              style={{ textShadow: '3px 3px 0 #1e3a5f' }}>
            FINAL JEOPARDY
          </h1>
          <p className="text-2xl text-blue-200">{finalJeopardy.category}</p>
        </div>

        {/* Wager Phase */}
        {status === 'final-jeopardy-wager' && (
          <div className="bg-blue-900/80 rounded-2xl p-8 border border-blue-700">
            <h2 className="text-2xl text-yellow-400 font-bold text-center mb-6">
              Place Your Wager
            </h2>

            {currentPlayer && currentPlayer.score > 0 && !hasSubmittedWager ? (
              <div className="max-w-md mx-auto space-y-6">
                <p className="text-blue-300 text-center">
                  Your current score: <span className="text-green-400 font-bold">${currentPlayer.score.toLocaleString()}</span>
                </p>
                <p className="text-blue-300 text-center text-sm">
                  Wager up to your entire score. Think carefully!
                </p>

                <div className="flex gap-4">
                  <input
                    type="number"
                    value={wagerInput}
                    onChange={(e) => {
                      setWagerInput(e.target.value);
                      setWagerError('');
                    }}
                    placeholder="Enter wager"
                    className="flex-1 px-4 py-3 rounded-lg bg-blue-800 border border-blue-600 text-white text-xl text-center"
                    min={0}
                    max={currentPlayer.score}
                  />
                  <button
                    onClick={handleWagerSubmit}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold rounded-lg"
                  >
                    Lock In
                  </button>
                </div>
                {wagerError && <p className="text-red-400 text-center">{wagerError}</p>}
              </div>
            ) : hasSubmittedWager ? (
              <div className="text-center">
                <p className="text-green-400 text-xl mb-4">
                  Wager locked in: ${finalJeopardy.wagers[currentPlayerId]?.toLocaleString()}
                </p>
                <p className="text-blue-300">Waiting for other players...</p>
              </div>
            ) : (
              <p className="text-center text-blue-300">
                {currentPlayer && currentPlayer.score <= 0
                  ? "You don't have enough points to participate in Final Jeopardy."
                  : "Waiting for players to submit wagers..."}
              </p>
            )}

            {/* Wager Status (for host) */}
            {isHost && (
              <div className="mt-8 pt-6 border-t border-blue-700">
                <h3 className="text-lg text-yellow-400 mb-4">Wager Status:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {eligiblePlayers.map(p => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg ${p.id in finalJeopardy.wagers ? 'bg-green-800/50' : 'bg-blue-800/50'}`}
                    >
                      <p className="text-white font-medium">{p.name}</p>
                      <p className={p.id in finalJeopardy.wagers ? 'text-green-400' : 'text-blue-400'}>
                        {p.id in finalJeopardy.wagers ? 'Submitted' : 'Waiting...'}
                      </p>
                    </div>
                  ))}
                </div>
                {allWagersSubmitted && (
                  <button
                    onClick={onStartQuestion}
                    className="mt-6 w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-blue-900 text-xl font-bold rounded-xl"
                  >
                    Reveal Question
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Question Phase */}
        {status === 'final-jeopardy-question' && (
          <div className="bg-blue-900/80 rounded-2xl p-8 border border-blue-700">
            {/* Question */}
            <div className="mb-8">
              <p className="text-2xl md:text-4xl text-white text-center font-medium leading-relaxed">
                {finalJeopardy.question}
              </p>
            </div>

            {/* Answer Timer */}
            <Timer
              duration={60}
              onTimeout={() => {}}
              isActive={true}
              showWarning={true}
              className="mb-8"
            />

            {/* Answer Input */}
            {!hasSubmittedAnswer && currentPlayer && currentPlayer.score > 0 ? (
              <div className="max-w-md mx-auto space-y-4">
                <input
                  type="text"
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  placeholder="What is..."
                  className="w-full px-4 py-3 rounded-lg bg-blue-800 border border-blue-600 text-white text-xl"
                  autoFocus
                />
                <button
                  onClick={handleAnswerSubmit}
                  disabled={!answerInput.trim()}
                  className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-blue-950 disabled:text-blue-700
                             text-blue-900 font-bold rounded-lg"
                >
                  Submit Answer
                </button>
              </div>
            ) : hasSubmittedAnswer ? (
              <div className="text-center">
                <p className="text-green-400 text-xl mb-4">Answer submitted!</p>
                <p className="text-blue-300">Waiting for other players...</p>
              </div>
            ) : null}

            {/* Host: Answer Status */}
            {isHost && (
              <div className="mt-8 pt-6 border-t border-blue-700">
                <h3 className="text-lg text-yellow-400 mb-4">Answer Status:</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {eligiblePlayers.map(p => (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg ${p.id in finalJeopardy.answers ? 'bg-green-800/50' : 'bg-blue-800/50'}`}
                    >
                      <p className="text-white font-medium">{p.name}</p>
                      <p className={p.id in finalJeopardy.answers ? 'text-green-400' : 'text-blue-400'}>
                        {p.id in finalJeopardy.answers ? 'Submitted' : 'Writing...'}
                      </p>
                    </div>
                  ))}
                </div>
                {allAnswersSubmitted && (
                  <button
                    onClick={onReveal}
                    className="mt-6 w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-blue-900 text-xl font-bold rounded-xl"
                  >
                    Reveal Answers
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Reveal Phase */}
        {status === 'final-jeopardy-reveal' && (
          <div className="bg-blue-900/80 rounded-2xl p-8 border border-blue-700">
            {/* Correct Answer */}
            <div className="mb-8">
              <h3 className="text-lg text-blue-300 text-center mb-2">The correct answer is:</h3>
              <div className="bg-green-800/50 border-2 border-green-500 rounded-lg p-6">
                <p className="text-2xl text-green-300 text-center font-medium">
                  {finalJeopardy.answer}
                </p>
              </div>
            </div>

            {/* Player Answers */}
            <div className="space-y-4">
              <h3 className="text-xl text-yellow-400 font-bold">Player Answers:</h3>
              {eligiblePlayers.map(player => {
                const wager = finalJeopardy.wagers[player.id] || 0;
                const answer = finalJeopardy.answers[player.id] || '(No answer)';
                const judged = player.id in judgments;

                return (
                  <div key={player.id} className="bg-blue-800/50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-bold">{player.name}</span>
                      <span className="text-yellow-400">Wagered: ${wager.toLocaleString()}</span>
                    </div>
                    <p className="text-blue-200 mb-3 italic">"{answer}"</p>

                    {isHost && !judged && (
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleJudgment(player.id, true)}
                          className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg"
                        >
                          Correct (+${wager.toLocaleString()})
                        </button>
                        <button
                          onClick={() => handleJudgment(player.id, false)}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
                        >
                          Wrong (-${wager.toLocaleString()})
                        </button>
                      </div>
                    )}

                    {judged && (
                      <div className={`text-center py-2 rounded-lg ${judgments[player.id] ? 'bg-green-600/50' : 'bg-red-600/50'}`}>
                        <span className="text-white font-bold">
                          {judgments[player.id] ? `+$${wager.toLocaleString()}` : `-$${wager.toLocaleString()}`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Finish Game Button */}
            {isHost && allJudged && (
              <button
                onClick={onFinishGame}
                className="mt-8 w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-blue-900 text-xl font-bold rounded-xl"
              >
                See Final Results
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
