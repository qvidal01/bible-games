'use client';

import { Team } from '../types/game';

interface FaceOffProps {
  teams: { red: Team; blue: Team };
  question: string;
  faceOffWinner: 'red' | 'blue' | null;
  isHost: boolean;
  playerTeam: 'red' | 'blue' | null;
  onBuzz: () => void;
  onSelectWinner: (winner: 'red' | 'blue') => void;
  onPlayOrPass: (decision: 'play' | 'pass') => void;
}

export default function FaceOff({
  teams,
  question,
  faceOffWinner,
  isHost,
  playerTeam,
  onBuzz,
  onSelectWinner,
  onPlayOrPass,
}: FaceOffProps) {
  const winningTeam = faceOffWinner ? teams[faceOffWinner] : null;

  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Face Off Header */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">
          FACE OFF!
        </h2>
        <p className="text-red-300">
          {!faceOffWinner
            ? 'Team captains buzz in to answer first!'
            : `${winningTeam?.name} buzzed in first!`
          }
        </p>
      </div>

      {/* Question */}
      <div className="bg-red-800 rounded-xl p-6 mb-8 border-4 border-yellow-500 shadow-lg">
        <p className="text-xl md:text-2xl text-white font-bold">
          {question}
        </p>
      </div>

      {/* Teams Display */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Red Team */}
        <div className={`
          rounded-xl p-6 border-4 transition-all
          ${faceOffWinner === 'red'
            ? 'bg-red-600 border-yellow-400 scale-105'
            : 'bg-red-900/60 border-red-700'
          }
        `}>
          <h3 className="text-red-200 font-bold text-xl mb-2">{teams.red.name}</h3>
          {faceOffWinner === 'red' && (
            <span className="text-yellow-400 font-bold text-lg">BUZZED!</span>
          )}
        </div>

        {/* Blue Team */}
        <div className={`
          rounded-xl p-6 border-4 transition-all
          ${faceOffWinner === 'blue'
            ? 'bg-blue-600 border-yellow-400 scale-105'
            : 'bg-blue-900/60 border-blue-700'
          }
        `}>
          <h3 className="text-blue-200 font-bold text-xl mb-2">{teams.blue.name}</h3>
          {faceOffWinner === 'blue' && (
            <span className="text-yellow-400 font-bold text-lg">BUZZED!</span>
          )}
        </div>
      </div>

      {/* Player Buzz Button */}
      {!isHost && playerTeam && !faceOffWinner && (
        <button
          onClick={onBuzz}
          className="w-full py-8 bg-red-600 hover:bg-red-500 text-white text-4xl font-bold rounded-2xl
                     transition-all transform hover:scale-105 active:scale-95 shadow-lg animate-pulse"
        >
          BUZZ!
        </button>
      )}

      {/* Host Controls - Select Winner */}
      {isHost && !faceOffWinner && (
        <div className="space-y-4">
          <p className="text-red-300 mb-4">Select which team buzzed in first:</p>
          <div className="flex gap-4">
            <button
              onClick={() => onSelectWinner('red')}
              className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xl rounded-xl transition-colors"
            >
              {teams.red.name} Buzzed
            </button>
            <button
              onClick={() => onSelectWinner('blue')}
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl rounded-xl transition-colors"
            >
              {teams.blue.name} Buzzed
            </button>
          </div>
        </div>
      )}

      {/* Host Controls - Play or Pass */}
      {isHost && faceOffWinner && (
        <div className="space-y-4">
          <p className="text-red-300 mb-4">
            {winningTeam?.name} gets to decide: Play or Pass?
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => onPlayOrPass('play')}
              className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white font-bold text-xl rounded-xl transition-colors"
            >
              PLAY
            </button>
            <button
              onClick={() => onPlayOrPass('pass')}
              className="flex-1 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xl rounded-xl transition-colors"
            >
              PASS
            </button>
          </div>
        </div>
      )}

      {/* Waiting Message for Players */}
      {!isHost && faceOffWinner && (
        <p className="text-red-300 text-lg">
          Waiting for {winningTeam?.name} to decide: Play or Pass...
        </p>
      )}
    </div>
  );
}
