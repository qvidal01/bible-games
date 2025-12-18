'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import { sanitizePlayerName } from '@shared/lib/validation';

export default function JoinTicTacToePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const [playerName, setPlayerName] = useState('');
  const [joinAsSpectator, setJoinAsSpectator] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [checkingRoom, setCheckingRoom] = useState(true);

  useEffect(() => {
    checkRoom();
  }, [code]);

  const checkRoom = async () => {
    try {
      const res = await fetch(`/api/rooms/${code.toUpperCase()}`);
      const data = await res.json();

      if (!data.exists) {
        setError('Room not found');
      } else if (data.room.gameType !== 'tic-tac-toe') {
        setError('This is not a Tic Tac Toe room');
      } else if (!data.canJoin) {
        setError(data.room.status === 'lobby' ? 'Room is full' : 'Game already in progress');
      } else {
        setRoomInfo(data.room);
      }
    } catch (err) {
      setError('Failed to check room');
    }
    setCheckingRoom(false);
  };

  const handleJoin = async () => {
    const sanitizedName = sanitizePlayerName(playerName);
    if (!sanitizedName) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const joinResponse = await fetch(`/api/rooms/${code.toUpperCase()}`, {
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
      sessionStorage.setItem('isSpectator', joinAsSpectator ? 'true' : 'false');

      router.push(`/tic-tac-toe/game/${code.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-orange-900 via-orange-800 to-orange-900 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-yellow-400 mb-4 tracking-wide">
            JOIN TIC TAC TOE
          </h1>
          <p className="text-orange-200">
            Room Code: <span className="text-yellow-400 font-bold text-2xl">{code.toUpperCase()}</span>
          </p>
        </div>

        <div className="bg-orange-950/80 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-orange-700/50">
          {checkingRoom ? (
            <LoadingSpinner message="Checking room..." />
          ) : error && !roomInfo ? (
            <div className="text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={() => router.push('/tic-tac-toe')}
                className="py-3 px-6 bg-orange-700 hover:bg-orange-600 text-white font-semibold rounded-lg"
              >
                Go Back
              </button>
            </div>
          ) : isLoading ? (
            <LoadingSpinner message="Joining game..." />
          ) : (
            <div className="space-y-4">
              {roomInfo && (
                <div className="bg-orange-900/50 rounded-lg p-4 mb-4">
                  <h3 className="text-white font-semibold">{roomInfo.roomName}</h3>
                  <p className="text-orange-300 text-sm">Hosted by {roomInfo.hostName}</p>
                  <p className="text-orange-400 text-sm">{roomInfo.playerCount}/2 players</p>
                </div>
              )}

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
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              <label className="flex items-center gap-3 bg-orange-900/30 rounded-lg p-3 border border-orange-700/50">
                <input
                  type="checkbox"
                  checked={joinAsSpectator}
                  onChange={(e) => setJoinAsSpectator(e.target.checked)}
                  className="w-4 h-4 accent-yellow-400"
                />
                <div className="text-sm text-orange-100">
                  <div className="font-semibold">Join as spectator</div>
                  <div className="text-orange-200/70 text-xs">Watch the game without taking turns</div>
                </div>
              </label>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                onClick={handleJoin}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-orange-900 font-bold text-lg rounded-lg transition-colors"
              >
                Join Game
              </button>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
