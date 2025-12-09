'use client';

import { GameState, Team } from '../types/game';

interface HostControlsProps {
  status: GameState['status'];
  teams: { red: Team; blue: Team };
  controllingTeam: 'red' | 'blue' | null;
  roundPoints: number;
  onAddStrike: () => void;
  onAwardPoints: (teamId: 'red' | 'blue') => void;
  onStealSuccess: () => void;
  onStealFail: () => void;
  onNextQuestion: () => void;
  onEndGame: () => void;
}

export default function HostControls({
  status,
  teams,
  controllingTeam,
  roundPoints,
  onAddStrike,
  onAwardPoints,
  onStealSuccess,
  onStealFail,
  onNextQuestion,
  onEndGame,
}: HostControlsProps) {
  const controllingTeamData = controllingTeam ? teams[controllingTeam] : null;
  const otherTeam = controllingTeam === 'red' ? 'blue' : 'red';

  return (
    <div className="bg-red-900/80 rounded-xl p-4 border border-red-700">
      <h3 className="text-yellow-400 font-bold text-lg mb-4 text-center">Host Controls</h3>

      {status === 'playing' && (
        <div className="space-y-3">
          {/* Strike Button */}
          <button
            onClick={onAddStrike}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-2xl">X</span>
            <span>Add Strike ({controllingTeamData?.strikes}/3)</span>
          </button>

          {/* Award Points to Controlling Team */}
          {controllingTeam && roundPoints > 0 && (
            <button
              onClick={() => onAwardPoints(controllingTeam)}
              className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
            >
              Award {roundPoints} pts to {controllingTeamData?.name}
            </button>
          )}
        </div>
      )}

      {status === 'steal' && (
        <div className="space-y-3">
          <p className="text-red-300 text-center mb-2">
            {teams[otherTeam].name} is trying to steal!
          </p>
          <div className="flex gap-3">
            <button
              onClick={onStealSuccess}
              className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
            >
              Steal Success!
            </button>
            <button
              onClick={onStealFail}
              className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
            >
              Steal Failed
            </button>
          </div>
        </div>
      )}

      {status === 'round-end' && (
        <div className="space-y-3">
          <p className="text-green-400 text-center font-bold mb-2">
            Round Complete!
          </p>
          <button
            onClick={onNextQuestion}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-red-900 font-bold rounded-lg transition-colors"
          >
            Next Question
          </button>
          <button
            onClick={onEndGame}
            className="w-full py-2 bg-red-700 hover:bg-red-600 text-white font-medium rounded-lg transition-colors text-sm"
          >
            End Game Early
          </button>
        </div>
      )}
    </div>
  );
}
