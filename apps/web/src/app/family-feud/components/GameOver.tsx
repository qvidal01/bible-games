'use client';

import { Team } from '../types/game';

interface GameOverProps {
  teams: { red: Team; blue: Team };
  onPlayAgain: () => void;
  isHost: boolean;
}

export default function GameOver({
  teams,
  onPlayAgain,
  isHost,
}: GameOverProps) {
  const winner = teams.red.score > teams.blue.score
    ? 'red'
    : teams.blue.score > teams.red.score
      ? 'blue'
      : 'tie';

  const winningTeam = winner !== 'tie' ? teams[winner] : null;

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Trophy/Celebration */}
      <div className="text-8xl mb-6">
        {winner === 'tie' ? '🤝' : '🏆'}
      </div>

      {/* Winner Announcement */}
      <h2 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-4">
        {winner === 'tie' ? "IT'S A TIE!" : 'WINNER!'}
      </h2>

      {winningTeam && (
        <h3 className={`text-3xl md:text-4xl font-bold mb-8 ${
          winner === 'red' ? 'text-red-400' : 'text-blue-400'
        }`}>
          {winningTeam.name}
        </h3>
      )}

      {/* Final Scores */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Red Team */}
        <div className={`
          rounded-xl p-6 border-4
          ${winner === 'red'
            ? 'bg-red-600 border-yellow-400'
            : 'bg-red-900/60 border-red-700'
          }
        `}>
          <h3 className="text-red-200 font-bold text-xl mb-2">{teams.red.name}</h3>
          <div className="text-4xl md:text-5xl font-bold text-white">
            {teams.red.score}
          </div>
          {winner === 'red' && (
            <span className="inline-block mt-2 text-yellow-400 text-2xl">👑</span>
          )}
        </div>

        {/* Blue Team */}
        <div className={`
          rounded-xl p-6 border-4
          ${winner === 'blue'
            ? 'bg-blue-600 border-yellow-400'
            : 'bg-blue-900/60 border-blue-700'
          }
        `}>
          <h3 className="text-blue-200 font-bold text-xl mb-2">{teams.blue.name}</h3>
          <div className="text-4xl md:text-5xl font-bold text-white">
            {teams.blue.score}
          </div>
          {winner === 'blue' && (
            <span className="inline-block mt-2 text-yellow-400 text-2xl">👑</span>
          )}
        </div>
      </div>

      {/* Encouraging Message */}
      <p className="text-red-300 text-lg mb-8">
        Great game everyone! May Jehovah bless your continued Bible study.
      </p>

      {/* Play Again Button */}
      {isHost && (
        <button
          onClick={onPlayAgain}
          className="py-4 px-8 bg-yellow-500 hover:bg-yellow-400 text-red-900 font-bold text-xl rounded-xl transition-all transform hover:scale-105"
        >
          Play Again!
        </button>
      )}

      {!isHost && (
        <p className="text-red-400">
          Waiting for host to start a new game...
        </p>
      )}
    </div>
  );
}
