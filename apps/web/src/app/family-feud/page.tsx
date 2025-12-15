'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import { sanitizePlayerName, isValidRoomCode } from '@shared/lib/validation';
import { initSounds } from '@shared/lib/sounds';
import { PublicRoom } from '@shared/types';

export default function FamilyFeudHome() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'browse'>('menu');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Room options
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(15);

  // Team names
  const [team1Name, setTeam1Name] = useState('Red Team');
  const [team2Name, setTeam2Name] = useState('Blue Team');

  // Public rooms
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    initSounds();
  }, []);

  useEffect(() => {
    if (mode === 'browse') {
      fetchPublicRooms();
    }
  }, [mode]);

  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms?gameType=family-feud');
      const data = await res.json();
      setPublicRooms(data.rooms || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
    setLoadingRooms(false);
  };

  const handleCreateGame = async () => {
    const sanitizedName = sanitizePlayerName(playerName);
    if (!sanitizedName) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const playerId = uuidv4();

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: sanitizedName,
          playerId,
          roomName: roomName.trim() || undefined,
          isPrivate,
          maxPlayers,
          gameType: 'family-feud',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create room');
      }

      const { room } = await response.json();

      sessionStorage.setItem('playerId', playerId);
      sessionStorage.setItem('playerName', sanitizedName);
      sessionStorage.setItem('isHost', 'true');
      sessionStorage.setItem('team1Name', team1Name);
      sessionStorage.setItem('team2Name', team2Name);

      router.push(`/family-feud/game/${room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    const sanitizedName = sanitizePlayerName(playerName);
    if (!sanitizedName) {
      setError('Please enter your name');
      return;
    }

    const upperCode = joinCode.toUpperCase();
    if (!isValidRoomCode(upperCode)) {
      setError('Please enter a valid 6-character room code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const checkResponse = await fetch(`/api/rooms/${upperCode}`);
      const roomData = await checkResponse.json();

      if (!checkResponse.ok || !roomData.exists) {
        throw new Error('Room not found');
      }

      if (!roomData.canJoin) {
        throw new Error(roomData.room.status === 'lobby' ? 'Room is full' : 'Game already in progress');
      }

      const joinResponse = await fetch(`/api/rooms/${upperCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', playerName: sanitizedName }),
      });

      if (!joinResponse.ok) {
        const data = await joinResponse.json();
        throw new Error(data.error || 'Failed to join room');
      }

      const playerId = uuidv4();
      sessionStorage.setItem('playerId', playerId);
      sessionStorage.setItem('playerName', sanitizedName);
      sessionStorage.setItem('isHost', 'false');

      router.push(`/family-feud/game/${upperCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 flex flex-col items-center justify-center p-4">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 left-4 text-red-300 hover:text-yellow-400 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Games
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-yellow-400 mb-4 tracking-wide jeopardy-title">
            BIBLE FAMILY FEUD
          </h1>
          <p className="text-red-200 text-xl">JW Edition</p>
          <p className="text-red-300 text-sm mt-2">
            Survey says... Team vs Team Bible trivia!
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-red-950/80 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-red-700/50">
          {isLoading ? (
            <LoadingSpinner message="Setting up game..." />
          ) : (
            <>
              {mode === 'menu' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setMode('create')}
                    className="w-full py-4 px-6 bg-yellow-500 hover:bg-yellow-400 text-red-900 font-bold text-xl rounded-xl
                               transition-all transform hover:scale-105 shadow-lg"
                  >
                    Create Game
                  </button>
                  <button
                    onClick={() => setMode('join')}
                    className="w-full py-4 px-6 bg-red-600 hover:bg-red-500 text-white font-bold text-xl rounded-xl
                               transition-all transform hover:scale-105 shadow-lg"
                  >
                    Join with Code
                  </button>
                  <button
                    onClick={() => setMode('browse')}
                    className="w-full py-3 px-6 bg-red-800 hover:bg-red-700 text-red-200 font-semibold rounded-xl
                               transition-all shadow-lg border border-red-600"
                  >
                    Browse Public Rooms
                  </button>

                  {/* How to Play */}
                  <div className="mt-6 pt-4 border-t border-red-700/50">
                    <h3 className="text-yellow-400 font-bold text-center mb-3">How to Play</h3>
                    <div className="bg-red-900/30 rounded-lg p-4 text-sm">
                      <ul className="text-red-200 space-y-2">
                        <li className="flex gap-2">
                          <span className="text-yellow-400">1.</span>
                          <span>Two teams face off to guess the most popular survey answers</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">2.</span>
                          <span>One player from each team does a face-off to control the board</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">3.</span>
                          <span>The controlling team guesses answers - 3 strikes and the other team can steal!</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">4.</span>
                          <span>Points are awarded for each correct answer on the board</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">5.</span>
                          <span>First team to reach the target score wins!</span>
                        </li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-red-700/30 text-red-300 text-xs">
                        <p><strong>Teams:</strong> 2-3 teams with up to 5 players each</p>
                        <p><strong>Spectators:</strong> Up to 10 can watch</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'create' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-yellow-400 text-center">Create New Game</h2>
                  <div>
                    <label className="block text-red-200 mb-2 font-medium">Your Name *</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-lg bg-red-900/50 border border-red-600 text-white placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-red-200 mb-2 font-medium">Room Name</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g., Jones Family Feud Night"
                      className="w-full px-4 py-3 rounded-lg bg-red-900/50 border border-red-600 text-white placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      maxLength={50}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-red-300 text-sm mb-1">Team 1</label>
                      <input
                        type="text"
                        value={team1Name}
                        onChange={(e) => setTeam1Name(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-red-900/30 border border-red-600/50 text-white text-sm"
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <label className="block text-blue-300 text-sm mb-1">Team 2</label>
                      <input
                        type="text"
                        value={team2Name}
                        onChange={(e) => setTeam2Name(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-blue-900/30 border border-blue-500/50 text-white text-sm"
                        maxLength={20}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-red-300 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      Private room
                    </label>
                  </div>
                  {error && <p className="text-yellow-400 text-sm">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => { setMode('menu'); setError(''); }}
                      className="flex-1 py-3 bg-red-800 hover:bg-red-700 text-white font-semibold rounded-lg">
                      Back
                    </button>
                    <button onClick={handleCreateGame}
                      className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-red-900 font-bold rounded-lg">
                      Create Room
                    </button>
                  </div>
                </div>
              )}

              {mode === 'join' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-yellow-400 text-center">Join Game</h2>
                  <div>
                    <label className="block text-red-200 mb-2 font-medium">Your Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-lg bg-red-900/50 border border-red-600 text-white placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-red-200 mb-2 font-medium">Room Code</label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
                      placeholder="Enter 6-letter code"
                      className="w-full px-4 py-3 rounded-lg bg-red-900/50 border border-red-600 text-white placeholder-red-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase tracking-widest text-center text-xl"
                      maxLength={6}
                    />
                  </div>
                  {error && <p className="text-yellow-400 text-sm">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => { setMode('menu'); setError(''); }}
                      className="flex-1 py-3 bg-red-800 hover:bg-red-700 text-white font-semibold rounded-lg">
                      Back
                    </button>
                    <button onClick={handleJoinGame}
                      className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-red-900 font-bold rounded-lg">
                      Join
                    </button>
                  </div>
                </div>
              )}

              {mode === 'browse' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-yellow-400">Public Family Feud Rooms</h2>
                    <button onClick={fetchPublicRooms} disabled={loadingRooms}
                      className="text-red-300 hover:text-red-200 text-sm">
                      {loadingRooms ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  {loadingRooms ? (
                    <LoadingSpinner message="Loading rooms..." size="sm" />
                  ) : publicRooms.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-red-400 mb-2">No public rooms available</p>
                      <p className="text-red-500 text-sm">Create a new game to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {publicRooms.map((room) => (
                        <div key={room.code}
                          onClick={() => { setJoinCode(room.code); setMode('join'); }}
                          className="bg-red-900/50 rounded-lg p-4 border border-red-700 hover:border-red-500 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-semibold">{room.roomName}</h3>
                              <p className="text-red-400 text-sm">Hosted by {room.hostName}</p>
                            </div>
                            <span className="text-xs text-red-400">{room.playerCount}/{room.maxPlayers}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setMode('menu')}
                    className="w-full py-3 bg-red-800 hover:bg-red-700 text-white font-semibold rounded-lg">
                    Back
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-6 text-center">
          <p className="text-red-300 text-sm">
            Full Family Feud gameplay coming soon!
          </p>
        </div>
      </div>
    </ErrorBoundary>
  );
}
