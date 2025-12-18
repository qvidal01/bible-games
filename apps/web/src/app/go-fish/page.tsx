'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import { sanitizePlayerName, isValidRoomCode } from '@shared/lib/validation';
import { PublicRoom } from '@shared/types';

export default function GoFishHome() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'browse'>('menu');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Room options
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Public rooms
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  useEffect(() => {
    if (mode === 'browse') {
      fetchPublicRooms();
    }
  }, [mode]);

  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms?gameType=go-fish');
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
          roomName: roomName.trim() || `${sanitizedName}'s Go Fish Game`,
          isPrivate,
          maxPlayers: 4,
          gameType: 'go-fish',
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
      sessionStorage.setItem('isSpectator', 'false');

      router.push(`/go-fish/game/${room.code}`);
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

      if (roomData.room.gameType !== 'go-fish') {
        throw new Error('This is not a Go Fish room');
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

      router.push(`/go-fish/game/${upperCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-cyan-600 via-blue-600 to-blue-800 flex flex-col items-center justify-center p-4">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 left-4 text-cyan-200 hover:text-yellow-400 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Games
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-yellow-400 mb-4 tracking-wide">
            GO FISH
          </h1>
          <p className="text-cyan-200 text-xl">Bible Characters Edition</p>
          <p className="text-cyan-300 text-sm mt-2">
            Collect sets of Bible characters!
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-blue-950/80 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-blue-500/50">
          {isLoading ? (
            <LoadingSpinner message="Setting up game..." />
          ) : (
            <>
              {mode === 'menu' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setMode('create')}
                    className="w-full py-4 px-6 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold text-xl rounded-xl
                               transition-all transform hover:scale-105 shadow-lg"
                  >
                    Create Game
                  </button>
                  <button
                    onClick={() => setMode('join')}
                    className="w-full py-4 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xl rounded-xl
                               transition-all transform hover:scale-105 shadow-lg"
                  >
                    Join with Code
                  </button>
                  <button
                    onClick={() => setMode('browse')}
                    className="w-full py-3 px-6 bg-blue-800 hover:bg-blue-700 text-blue-200 font-semibold rounded-xl
                               transition-all shadow-lg border border-blue-500"
                  >
                    Browse Public Rooms
                  </button>

                  {/* How to Play */}
                  <div className="mt-6 pt-4 border-t border-blue-500/50">
                    <h3 className="text-yellow-400 font-bold mb-3">How to Play</h3>
                    <div className="bg-blue-900/30 rounded-lg p-4 text-sm">
                      <ul className="text-blue-200 space-y-2">
                        <li className="flex gap-2">
                          <span className="text-yellow-400">1.</span>
                          <span>Each player gets 7 cards from 8 Bible categories</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">2.</span>
                          <span>Ask another player: "Do you have any [category]?"</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">3.</span>
                          <span>If they have cards, they give them all to you</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">4.</span>
                          <span>If not, "Go Fish!" - draw from the deck</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">5.</span>
                          <span>Collect all 4 cards in a category to score a set!</span>
                        </li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-blue-500/30 text-blue-300 text-xs">
                        <p><strong>Players:</strong> 2-4 players</p>
                        <p><strong>Categories:</strong> Prophets, Apostles, Kings, Women of Faith, and more!</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'create' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-yellow-400 text-center">Create New Game</h2>
                  <div>
                    <label className="block text-blue-200 mb-2 font-medium">Your Name *</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-lg bg-blue-900/50 border border-blue-500 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-blue-200 mb-2 font-medium">Room Name</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g., Family Game Night"
                      className="w-full px-4 py-3 rounded-lg bg-blue-900/50 border border-blue-500 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      maxLength={50}
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-blue-300 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      Private room
                    </label>
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => { setMode('menu'); setError(''); }}
                      className="flex-1 py-3 bg-blue-800 hover:bg-blue-700 text-white font-semibold rounded-lg">
                      Back
                    </button>
                    <button onClick={handleCreateGame}
                      className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold rounded-lg">
                      Create Room
                    </button>
                  </div>
                </div>
              )}

              {mode === 'join' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-yellow-400 text-center">Join Game</h2>
                  <div>
                    <label className="block text-blue-200 mb-2 font-medium">Your Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-lg bg-blue-900/50 border border-blue-500 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-blue-200 mb-2 font-medium">Room Code</label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
                      placeholder="Enter 6-letter code"
                      className="w-full px-4 py-3 rounded-lg bg-blue-900/50 border border-blue-500 text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase tracking-widest text-center text-xl"
                      maxLength={6}
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => { setMode('menu'); setError(''); }}
                      className="flex-1 py-3 bg-blue-800 hover:bg-blue-700 text-white font-semibold rounded-lg">
                      Back
                    </button>
                    <button onClick={handleJoinGame}
                      className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold rounded-lg">
                      Join
                    </button>
                  </div>
                </div>
              )}

              {mode === 'browse' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-yellow-400">Public Rooms</h2>
                    <button onClick={fetchPublicRooms} disabled={loadingRooms}
                      className="text-blue-300 hover:text-blue-200 text-sm">
                      {loadingRooms ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  {loadingRooms ? (
                    <LoadingSpinner message="Loading rooms..." size="sm" />
                  ) : publicRooms.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-blue-400 mb-2">No public rooms available</p>
                      <p className="text-blue-500 text-sm">Create a new game or join with a code</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {publicRooms.map((room) => (
                        <div key={room.code}
                          onClick={() => { setJoinCode(room.code); setMode('join'); }}
                          className="bg-blue-900/50 rounded-lg p-4 border border-blue-600 hover:border-blue-400 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-semibold">{room.roomName}</h3>
                              <p className="text-blue-400 text-sm">Hosted by {room.hostName}</p>
                            </div>
                            <span className="text-xs text-blue-400">{room.playerCount}/4</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setMode('menu')}
                    className="w-full py-3 bg-blue-800 hover:bg-blue-700 text-white font-semibold rounded-lg">
                    Back
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
