'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import { sanitizePlayerName, isValidRoomCode } from '@shared/lib/validation';
import { PublicRoom } from '@shared/types';

export default function TicTacToeHome() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join' | 'browse'>('menu');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Room options
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roundsToWin, setRoundsToWin] = useState(2); // Best of 3
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'mixed'>('mixed');

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
      const res = await fetch('/api/rooms?gameType=tic-tac-toe');
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
          roomName: roomName.trim() || `${sanitizedName}'s Tic Tac Toe`,
          isPrivate,
          maxPlayers: 2,
          gameType: 'tic-tac-toe',
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
      sessionStorage.setItem('ttt-roundsToWin', String(roundsToWin));
      sessionStorage.setItem('ttt-difficulty', difficulty);

      router.push(`/tic-tac-toe/game/${room.code}`);
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

      if (roomData.room.gameType !== 'tic-tac-toe') {
        throw new Error('This is not a Tic Tac Toe room');
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

      router.push(`/tic-tac-toe/game/${upperCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-orange-900 via-orange-800 to-orange-900 flex flex-col items-center justify-center p-4">
        {/* Back Button */}
        <button
          onClick={() => router.push('/')}
          className="absolute top-4 left-4 text-orange-300 hover:text-yellow-400 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Games
        </button>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bold text-yellow-400 mb-4 tracking-wide">
            BIBLE TIC TAC TOE
          </h1>
          <p className="text-orange-200 text-xl">JW Edition</p>
          <p className="text-orange-300 text-sm mt-2">
            Answer trivia questions to claim your spot!
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-orange-950/80 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-orange-700/50">
          {isLoading ? (
            <LoadingSpinner message="Setting up game..." />
          ) : (
            <>
              {mode === 'menu' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setMode('create')}
                    className="w-full py-4 px-6 bg-yellow-500 hover:bg-yellow-400 text-orange-900 font-bold text-xl rounded-xl
                               transition-all transform hover:scale-105 shadow-lg"
                  >
                    Create Game
                  </button>
                  <button
                    onClick={() => setMode('join')}
                    className="w-full py-4 px-6 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xl rounded-xl
                               transition-all transform hover:scale-105 shadow-lg"
                  >
                    Join with Code
                  </button>
                  <button
                    onClick={() => setMode('browse')}
                    className="w-full py-3 px-6 bg-orange-800 hover:bg-orange-700 text-orange-200 font-semibold rounded-xl
                               transition-all shadow-lg border border-orange-600"
                  >
                    Browse Public Rooms
                  </button>

                  {/* How to Play */}
                  <div className="mt-6 pt-4 border-t border-orange-700/50">
                    <h3 className="text-yellow-400 font-bold mb-3">How to Play</h3>
                    <div className="bg-orange-900/30 rounded-lg p-4 text-sm">
                      <ul className="text-orange-200 space-y-2">
                        <li className="flex gap-2">
                          <span className="text-yellow-400">1.</span>
                          <span>Take turns selecting a square on the board</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">2.</span>
                          <span>Answer a Bible trivia question correctly to claim it</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">3.</span>
                          <span>Wrong answer? Your opponent gets a chance!</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">4.</span>
                          <span>Get three in a row to win the round</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="text-yellow-400">5.</span>
                          <span>Best of 3 (or 5) rounds wins the match!</span>
                        </li>
                      </ul>
                      <div className="mt-3 pt-3 border-t border-orange-700/30 text-orange-300 text-xs">
                        <p><strong>Players:</strong> 2 players (1v1)</p>
                        <p><strong>Time:</strong> ~5-10 minutes per match</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mode === 'create' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-yellow-400 text-center">Create New Game</h2>
                  <div>
                    <label className="block text-orange-200 mb-2 font-medium">Your Name *</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-lg bg-orange-900/50 border border-orange-600 text-white placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-orange-200 mb-2 font-medium">Room Name</label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      placeholder="e.g., Bible Challenge"
                      className="w-full px-4 py-3 rounded-lg bg-orange-900/50 border border-orange-600 text-white placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      maxLength={50}
                    />
                  </div>

                  {/* Game Settings */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-orange-200 mb-2 font-medium">Match Type</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRoundsToWin(2)}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            roundsToWin === 2
                              ? 'bg-yellow-500 text-orange-900'
                              : 'bg-orange-800 text-orange-200 hover:bg-orange-700'
                          }`}
                        >
                          Best of 3
                        </button>
                        <button
                          onClick={() => setRoundsToWin(3)}
                          className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                            roundsToWin === 3
                              ? 'bg-yellow-500 text-orange-900'
                              : 'bg-orange-800 text-orange-200 hover:bg-orange-700'
                          }`}
                        >
                          Best of 5
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-orange-200 mb-2 font-medium">Difficulty</label>
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                        className="w-full px-4 py-3 rounded-lg bg-orange-900/50 border border-orange-600 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="mixed">Mixed (All Levels)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-orange-300 text-sm cursor-pointer">
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
                      className="flex-1 py-3 bg-orange-800 hover:bg-orange-700 text-white font-semibold rounded-lg">
                      Back
                    </button>
                    <button onClick={handleCreateGame}
                      className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-orange-900 font-bold rounded-lg">
                      Create Room
                    </button>
                  </div>
                </div>
              )}

              {mode === 'join' && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-yellow-400 text-center">Join Game</h2>
                  <div>
                    <label className="block text-orange-200 mb-2 font-medium">Your Name</label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => { setPlayerName(e.target.value); setError(''); }}
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-lg bg-orange-900/50 border border-orange-600 text-white placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      maxLength={20}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-orange-200 mb-2 font-medium">Room Code</label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
                      placeholder="Enter 6-letter code"
                      className="w-full px-4 py-3 rounded-lg bg-orange-900/50 border border-orange-600 text-white placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase tracking-widest text-center text-xl"
                      maxLength={6}
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm">{error}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => { setMode('menu'); setError(''); }}
                      className="flex-1 py-3 bg-orange-800 hover:bg-orange-700 text-white font-semibold rounded-lg">
                      Back
                    </button>
                    <button onClick={handleJoinGame}
                      className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-orange-900 font-bold rounded-lg">
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
                      className="text-orange-300 hover:text-orange-200 text-sm">
                      {loadingRooms ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                  {loadingRooms ? (
                    <LoadingSpinner message="Loading rooms..." size="sm" />
                  ) : publicRooms.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-orange-400 mb-2">No public rooms available</p>
                      <p className="text-orange-500 text-sm">Create a new game or join with a code</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {publicRooms.map((room) => (
                        <div key={room.code}
                          onClick={() => { setJoinCode(room.code); setMode('join'); }}
                          className="bg-orange-900/50 rounded-lg p-4 border border-orange-700 hover:border-orange-500 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-white font-semibold">{room.roomName}</h3>
                              <p className="text-orange-400 text-sm">Hosted by {room.hostName}</p>
                            </div>
                            <span className="text-xs text-orange-400">{room.playerCount}/2</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setMode('menu')}
                    className="w-full py-3 bg-orange-800 hover:bg-orange-700 text-white font-semibold rounded-lg">
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
