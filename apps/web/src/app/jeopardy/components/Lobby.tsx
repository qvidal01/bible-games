'use client';

import { useState, useEffect } from 'react';
import { Player, Team } from '../types/game';
import QRCodeDisplay from '@shared/components/QRCodeDisplay';
import { useIsTeamMode, useTeams, useGameStore } from '../lib/gameStore';

interface ConnectionStats {
  totalConnections: number;
  availableSlots: number;
  isAtCapacity: boolean;
  isNearCapacity: boolean;
  activeRooms: number;
}

interface LobbyProps {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  onStartCategorySelect: () => void;
}

export default function Lobby({
  roomCode,
  players,
  isHost,
  onStartCategorySelect,
}: LobbyProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [serverStats, setServerStats] = useState<ConnectionStats | null>(null);

  const isTeamMode = useIsTeamMode();
  const teams = useTeams();
  const joinTeam = useGameStore((state) => state.joinTeam);
  const currentPlayerId = typeof window !== 'undefined' ? sessionStorage.getItem('playerId') : null;

  // Fetch server stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/connections/status');
        const data = await res.json();
        setServerStats(data);
      } catch (error) {
        console.error('Failed to fetch server stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareGame = async () => {
    const shareUrl = `${window.location.origin}/join/${roomCode}`;
    const shareData = {
      title: 'Bible Jeopardy - JW Edition',
      text: `Join my Bible Jeopardy game! Room code: ${roomCode}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const activePlayers = players.filter(p => !p.isSpectator);
  const spectators = players.filter(p => p.isSpectator);

  return (
    <div className="max-w-lg mx-auto">
      {/* Room Code Display */}
      <div className="bg-blue-900/80 rounded-2xl p-6 mb-6 text-center border border-blue-700">
        <p className="text-blue-300 mb-2">Room Code</p>
        <div className="flex items-center justify-center gap-3 mb-4">
          <span
            className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-widest"
            aria-label={`Room code: ${roomCode.split('').join(' ')}`}
          >
            {roomCode}
          </span>
          <button
            onClick={copyRoomCode}
            className={`p-2 rounded-lg transition-colors ${
              copied ? 'bg-green-600' : 'bg-blue-700 hover:bg-blue-600'
            }`}
            title={copied ? 'Copied!' : 'Copy room code'}
            aria-label={copied ? 'Room code copied' : 'Copy room code to clipboard'}
          >
            {copied ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
          >
            {showQR ? 'Hide QR' : 'Show QR Code'}
          </button>
          <button
            onClick={shareGame}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          {isHost && (
            <button
              onClick={() => window.open(`/jeopardy/spectate/${roomCode}`, '_blank')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              title="Open a TV-friendly view to share on Zoom or display on a projector"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Projector View
            </button>
          )}
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="mt-4 flex justify-center">
            <QRCodeDisplay roomCode={roomCode} size={180} />
          </div>
        )}

        <p className="text-blue-400 text-sm mt-4">
          Share this code with players to join
        </p>
      </div>

      {/* Game Mode Display */}
      {isTeamMode && teams.length > 0 && (
        <div className="bg-gradient-to-r from-red-900/30 via-blue-900/30 to-blue-900/30 rounded-2xl p-4 mb-6 border border-blue-700">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">👥</span>
            <h3 className="text-yellow-400 font-bold text-lg">Team Play Mode</h3>
          </div>
          <p className="text-blue-300 text-sm text-center">Players must join a team before the game starts</p>
        </div>
      )}

      {/* Team Selection (Team Mode) */}
      {isTeamMode && teams.length > 0 ? (
        <div className="bg-blue-900/80 rounded-2xl p-6 mb-6 border border-blue-700">
          <h3 className="text-yellow-400 font-bold text-xl mb-4">
            Teams ({activePlayers.length} players)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team, index) => {
              const teamPlayers = activePlayers.filter(p => p.teamId === team.id);
              const currentPlayer = players.find(p => p.id === currentPlayerId);
              const isOnThisTeam = currentPlayer?.teamId === team.id;

              return (
                <div
                  key={team.id}
                  className={`rounded-xl p-4 border-2 transition-all ${
                    index === 0
                      ? 'bg-red-900/30 border-red-600/50'
                      : 'bg-blue-800/30 border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-bold text-lg ${index === 0 ? 'text-red-400' : 'text-blue-400'}`}>
                      {team.name}
                    </h4>
                    <span className={`text-sm ${index === 0 ? 'text-red-300' : 'text-blue-300'}`}>
                      {teamPlayers.length} players
                    </span>
                  </div>

                  {/* Team Members */}
                  <div className="space-y-2 mb-3 min-h-[60px]">
                    {teamPlayers.length === 0 ? (
                      <p className="text-blue-500 text-sm italic">No players yet</p>
                    ) : (
                      teamPlayers.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between bg-black/20 px-3 py-2 rounded-lg"
                        >
                          <span className="text-white text-sm">{player.name}</span>
                          {player.isHost && (
                            <span className="text-xs bg-yellow-500 text-blue-900 px-1.5 py-0.5 rounded font-bold">
                              HOST
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Join Team Button */}
                  {currentPlayerId && !isOnThisTeam && (
                    <button
                      onClick={() => joinTeam(currentPlayerId, team.id)}
                      className={`w-full py-2 rounded-lg font-semibold text-sm transition-colors ${
                        index === 0
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      Join {team.name}
                    </button>
                  )}
                  {isOnThisTeam && (
                    <div className={`w-full py-2 rounded-lg font-semibold text-sm text-center ${
                      index === 0 ? 'bg-red-700/50 text-red-300' : 'bg-blue-700/50 text-blue-300'
                    }`}>
                      You&apos;re on this team
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Unassigned Players */}
          {(() => {
            const unassigned = activePlayers.filter(p => !p.teamId);
            if (unassigned.length === 0) return null;
            return (
              <div className="mt-4 pt-4 border-t border-blue-700">
                <h4 className="text-yellow-400 text-sm mb-2">Waiting to join a team ({unassigned.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {unassigned.map((player) => (
                    <span
                      key={player.id}
                      className="text-white text-sm px-3 py-1 bg-blue-800/50 rounded-lg"
                    >
                      {player.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Individual Mode Players List */
        <div className="bg-blue-900/80 rounded-2xl p-6 mb-6 border border-blue-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">👤</span>
            <h3 className="text-yellow-400 font-bold text-xl">
              Players ({activePlayers.length})
            </h3>
          </div>
          {activePlayers.length === 0 ? (
            <p className="text-blue-400 text-center py-4" role="status">
              Waiting for players to join...
            </p>
          ) : (
            <div className="space-y-2" role="list" aria-label="Players in game">
              {activePlayers.map((player) => (
                <div
                  key={player.id}
                  role="listitem"
                  className="flex items-center justify-between bg-blue-800/50 px-4 py-3 rounded-lg"
                >
                  <span className="text-white font-medium">{player.name}</span>
                  {player.isHost && (
                    <span className="text-xs bg-yellow-500 text-blue-900 px-2 py-1 rounded font-bold">
                      HOST
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Spectators */}
      {spectators.length > 0 && (
        <div className="bg-blue-900/80 rounded-2xl p-4 mb-6 border border-blue-700">
          <h4 className="text-blue-300 text-sm mb-2">Spectators ({spectators.length})</h4>
          <div className="space-y-1">
            {spectators.map((spectator) => (
              <div
                key={spectator.id}
                className="text-blue-400 text-sm px-4 py-2 bg-blue-800/30 rounded-lg"
              >
                {spectator.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Game Button (Host Only) */}
      {isHost && (
        <button
          onClick={onStartCategorySelect}
          disabled={activePlayers.length < 1}
          className={`
            w-full py-4 font-bold text-xl rounded-xl transition-all transform
            focus:outline-none focus:ring-4 focus:ring-yellow-300
            ${activePlayers.length >= 1
              ? 'bg-yellow-500 hover:bg-yellow-400 text-blue-900 hover:scale-105'
              : 'bg-blue-950 text-blue-700 cursor-not-allowed'
            }
          `}
          aria-disabled={activePlayers.length < 1}
        >
          {activePlayers.length >= 1 ? 'Select Categories' : 'Waiting for players...'}
        </button>
      )}

      {/* Instructions for Players */}
      {!isHost && (
        <div className="text-center text-blue-300" role="status" aria-live="polite">
          <p>Waiting for the host to start the game...</p>
        </div>
      )}

      {/* Game Tips */}
      <div className="mt-6 p-4 bg-blue-950/50 rounded-lg border border-blue-800">
        <h4 className="text-yellow-400 font-semibold mb-2">How to Play</h4>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>• Host selects 5 categories from 20 available</li>
          <li>• Players buzz in to answer questions</li>
          <li>• Correct answers add points, wrong answers subtract</li>
          <li>• Watch out for Daily Doubles!</li>
          <li>• Game ends with Final Jeopardy</li>
        </ul>
      </div>

      {/* Server Status */}
      {serverStats && (
        <div className={`mt-4 p-3 rounded-lg border text-sm ${
          serverStats.isAtCapacity
            ? 'bg-red-900/30 border-red-700 text-red-300'
            : serverStats.isNearCapacity
            ? 'bg-yellow-900/30 border-yellow-700 text-yellow-300'
            : 'bg-green-900/30 border-green-700 text-green-300'
        }`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                serverStats.isAtCapacity
                  ? 'bg-red-500'
                  : serverStats.isNearCapacity
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`} />
              Server Status
            </span>
            <span>
              {serverStats.totalConnections}/90 players • {serverStats.activeRooms} active {serverStats.activeRooms === 1 ? 'room' : 'rooms'}
            </span>
          </div>
          {serverStats.isNearCapacity && !serverStats.isAtCapacity && (
            <p className="mt-1 text-xs opacity-80">
              Server is getting busy. {serverStats.availableSlots} slots remaining.
            </p>
          )}
          {serverStats.isAtCapacity && (
            <p className="mt-1 text-xs opacity-80">
              Server at capacity. New players will be placed in a waiting room.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
