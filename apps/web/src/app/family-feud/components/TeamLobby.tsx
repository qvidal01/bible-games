'use client';

import { useState } from 'react';
import { Player, Team } from '../types/game';
import QRCodeDisplay from '@shared/components/QRCodeDisplay';

interface TeamLobbyProps {
  roomCode: string;
  players: Player[];
  teams: { red: Team; blue: Team };
  isHost: boolean;
  currentPlayerId: string;
  onJoinTeam: (teamId: 'red' | 'blue') => void;
  onSetTeamName: (teamId: 'red' | 'blue', name: string) => void;
  onStartGame: () => void;
}

export default function TeamLobby({
  roomCode,
  players,
  teams,
  isHost,
  currentPlayerId,
  onJoinTeam,
  onSetTeamName,
  onStartGame,
}: TeamLobbyProps) {
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareRoom = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Bible Family Feud!',
          text: `Join my Family Feud game with code: ${roomCode}`,
          url: `${window.location.origin}/family-feud/join/${roomCode}`,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      copyRoomCode();
    }
  };

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const unassignedPlayers = players.filter(p => !p.teamId);
  const redTeamPlayers = players.filter(p => p.teamId === 'red');
  const blueTeamPlayers = players.filter(p => p.teamId === 'blue');

  const canStartGame = redTeamPlayers.length >= 1 && blueTeamPlayers.length >= 1;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Room Code Display */}
      <div className="bg-red-900/80 rounded-2xl p-6 mb-6 text-center border border-red-700">
        <p className="text-red-300 mb-2">Room Code</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl md:text-5xl font-bold text-yellow-400 tracking-widest">
            {roomCode}
          </span>
          <button
            onClick={copyRoomCode}
            className="p-2 bg-red-700 hover:bg-red-600 rounded-lg transition-colors"
            title="Copy room code"
          >
            {copied ? (
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Share Actions */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setShowQR(!showQR)}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            {showQR ? 'Hide QR' : 'Show QR'}
          </button>
          <button
            onClick={shareRoom}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-red-900 text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="mt-4 flex justify-center">
            <QRCodeDisplay roomCode={roomCode} size={150} gameType="family-feud" />
          </div>
        )}

        <p className="text-red-400 text-sm mt-3">
          {copied ? 'Copied!' : 'Share this code with players to join'}
        </p>
      </div>

      {/* Teams Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Red Team */}
        <div className={`bg-red-900/60 rounded-2xl p-6 border-2 ${currentPlayer?.teamId === 'red' ? 'border-yellow-400' : 'border-red-700'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-red-300 font-bold text-xl">{teams.red.name}</h3>
            <span className="bg-red-700 text-red-100 px-3 py-1 rounded-full text-sm font-bold">
              {redTeamPlayers.length} players
            </span>
          </div>

          {isHost && (
            <input
              type="text"
              value={teams.red.name}
              onChange={(e) => onSetTeamName('red', e.target.value)}
              className="w-full px-3 py-2 mb-4 rounded-lg bg-red-950/50 border border-red-600 text-white placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Team name"
              maxLength={20}
            />
          )}

          <div className="space-y-2 mb-4 min-h-[100px]">
            {redTeamPlayers.length === 0 ? (
              <p className="text-red-400 text-center py-4">No players yet</p>
            ) : (
              redTeamPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg ${
                    player.id === currentPlayerId ? 'bg-yellow-500/30 border border-yellow-500' : 'bg-red-800/50'
                  }`}
                >
                  <span className="text-white font-medium">{player.name}</span>
                  {player.isHost && (
                    <span className="text-xs bg-yellow-500 text-red-900 px-2 py-1 rounded font-bold">
                      HOST
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {currentPlayer?.teamId !== 'red' && (
            <button
              onClick={() => onJoinTeam('red')}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors"
            >
              Join Red Team
            </button>
          )}
        </div>

        {/* Blue Team */}
        <div className={`bg-blue-900/60 rounded-2xl p-6 border-2 ${currentPlayer?.teamId === 'blue' ? 'border-yellow-400' : 'border-blue-700'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-blue-300 font-bold text-xl">{teams.blue.name}</h3>
            <span className="bg-blue-700 text-blue-100 px-3 py-1 rounded-full text-sm font-bold">
              {blueTeamPlayers.length} players
            </span>
          </div>

          {isHost && (
            <input
              type="text"
              value={teams.blue.name}
              onChange={(e) => onSetTeamName('blue', e.target.value)}
              className="w-full px-3 py-2 mb-4 rounded-lg bg-blue-950/50 border border-blue-600 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Team name"
              maxLength={20}
            />
          )}

          <div className="space-y-2 mb-4 min-h-[100px]">
            {blueTeamPlayers.length === 0 ? (
              <p className="text-blue-400 text-center py-4">No players yet</p>
            ) : (
              blueTeamPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-4 py-2 rounded-lg ${
                    player.id === currentPlayerId ? 'bg-yellow-500/30 border border-yellow-500' : 'bg-blue-800/50'
                  }`}
                >
                  <span className="text-white font-medium">{player.name}</span>
                  {player.isHost && (
                    <span className="text-xs bg-yellow-500 text-blue-900 px-2 py-1 rounded font-bold">
                      HOST
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {currentPlayer?.teamId !== 'blue' && (
            <button
              onClick={() => onJoinTeam('blue')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
            >
              Join Blue Team
            </button>
          )}
        </div>
      </div>

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <div className="bg-red-900/60 rounded-2xl p-6 mb-6 border border-red-700">
          <h3 className="text-red-300 font-bold text-lg mb-4">
            Waiting to Join a Team ({unassignedPlayers.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {unassignedPlayers.map((player) => (
              <span
                key={player.id}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  player.id === currentPlayerId
                    ? 'bg-yellow-500 text-red-900'
                    : 'bg-red-700 text-red-100'
                }`}
              >
                {player.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Start Game Button (Host Only) */}
      {isHost && (
        <button
          onClick={onStartGame}
          disabled={!canStartGame}
          className={`
            w-full py-4 font-bold text-xl rounded-xl transition-all transform
            ${canStartGame
              ? 'bg-yellow-500 hover:bg-yellow-400 text-red-900 hover:scale-105'
              : 'bg-red-950 text-red-600 cursor-not-allowed'
            }
          `}
        >
          {canStartGame ? 'Start Game!' : 'Need at least 1 player per team'}
        </button>
      )}

      {/* Instructions for Players */}
      {!isHost && (
        <div className="text-center text-red-300">
          <p>Pick a team! Waiting for the host to start the game...</p>
        </div>
      )}
    </div>
  );
}
