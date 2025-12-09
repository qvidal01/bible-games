'use client';

import { useState } from 'react';
import { Player } from '../types/game';

interface HostControlsProps {
  players: Player[];
  currentPlayerId: string;
  onTransferHost: (newHostId: string) => void;
  onEndGame: () => void;
  isStudyMode?: boolean;
}

export default function HostControls({
  players,
  currentPlayerId,
  onTransferHost,
  onEndGame,
  isStudyMode = false,
}: HostControlsProps) {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Get other players (not the current host)
  const otherPlayers = players.filter(p => p.id !== currentPlayerId && !p.isSpectator);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {/* Pass the Baton - only show if there are other players and not in study mode */}
        {!isStudyMode && otherPlayers.length > 0 && (
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg
                       transition-colors flex items-center gap-2 text-sm"
            title="Transfer host role to another player"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            Pass the Baton
          </button>
        )}

        {/* End Game */}
        <button
          onClick={() => setShowEndConfirm(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg
                     transition-colors flex items-center gap-2 text-sm"
          title="End the game for everyone"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          End Game
        </button>
      </div>

      {/* Transfer Host Modal */}
      {showTransferModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTransferModal(false)}
        >
          <div
            className="bg-blue-900 rounded-2xl p-6 max-w-md w-full border-2 border-purple-500"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              Pass the Baton
            </h3>

            <p className="text-blue-300 mb-4">
              Select a player to become the new host.
              <strong className="text-yellow-400"> You will leave the game</strong> after transferring.
            </p>

            <div className="space-y-2 mb-6">
              {otherPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => {
                    if (confirm(`Transfer host role to ${player.name}? You will leave the game.`)) {
                      onTransferHost(player.id);
                      setShowTransferModal(false);
                    }
                  }}
                  className="w-full p-3 bg-blue-800 hover:bg-purple-600 rounded-lg text-left
                             transition-colors flex items-center justify-between"
                >
                  <span className="text-white font-medium">{player.name}</span>
                  <span className="text-blue-400 text-sm">Score: ${player.score}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowTransferModal(false)}
              className="w-full py-2 bg-blue-800 hover:bg-blue-700 text-blue-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* End Game Confirmation Modal */}
      {showEndConfirm && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEndConfirm(false)}
        >
          <div
            className="bg-blue-900 rounded-2xl p-6 max-w-md w-full border-2 border-red-500"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              End Game?
            </h3>

            <p className="text-blue-300 mb-6">
              This will end the game for <strong className="text-yellow-400">all players</strong>.
              Everyone will be returned to the home screen.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 bg-blue-800 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onEndGame();
                  setShowEndConfirm(false);
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
              >
                End Game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
