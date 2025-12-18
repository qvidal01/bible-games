'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import { sanitizePlayerName } from '@shared/lib/validation';

export default function JoinKidsTriviaPage({ params }: { params: Promise<{ code: string }> }) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const checkRoom = async () => {
    try {
      const res = await fetch(`/api/rooms/${code.toUpperCase()}`);
      const data = await res.json();

      if (!data.exists) {
        setError('Room not found');
      } else if (data.room.gameType !== 'kids-trivia') {
        setError('That room is for a different game.');
      } else if (!data.canJoin) {
        setError(data.room.status === 'lobby' ? 'Room is full' : 'Game already in progress');
      } else {
        setRoomInfo(data.room);
      }
    } catch {
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

      router.push(`/kids-trivia/game/${code.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-green-900 to-blue-950 flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-yellow-300 mb-3 tracking-tight">
            JOIN KIDS TRIVIA
          </h1>
          <p className="text-emerald-200">
            Room Code:{' '}
            <span className="text-yellow-300 font-black text-2xl tracking-widest">
              {code.toUpperCase()}
            </span>
          </p>
        </div>

        <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/10">
          {checkingRoom ? (
            <LoadingSpinner message="Checking room..." />
          ) : error && !roomInfo ? (
            <div className="text-center">
              <p className="text-red-300 mb-4">{error}</p>
              <button
                onClick={() => router.push('/kids-trivia')}
                className="py-3 px-6 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg"
              >
                Go Back
              </button>
            </div>
          ) : isLoading ? (
            <LoadingSpinner message="Joining game..." />
          ) : (
            <div className="space-y-4">
              {roomInfo && (
                <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
                  <h3 className="text-white font-semibold">{roomInfo.roomName}</h3>
                  <p className="text-emerald-200 text-sm">Hosted by {roomInfo.hostName}</p>
                  <p className="text-emerald-100/80 text-sm">
                    {roomInfo.playerCount}/{roomInfo.maxPlayers} players
                  </p>
                </div>
              )}

              <div>
                <label className="block text-emerald-100 mb-2 font-medium">Your Name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-300"
                  maxLength={20}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>

              <label className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                <input
                  type="checkbox"
                  checked={joinAsSpectator}
                  onChange={(e) => setJoinAsSpectator(e.target.checked)}
                  className="w-4 h-4 accent-yellow-300"
                />
                <div className="text-sm text-emerald-50">
                  <div className="font-semibold">Join as spectator</div>
                  <div className="text-emerald-100/70 text-xs">Watch the game without answering</div>
                </div>
              </label>

              {error && <p className="text-red-300 text-sm">{error}</p>}

              <button
                onClick={handleJoin}
                className="w-full py-3 bg-yellow-300 hover:bg-yellow-200 text-blue-950 font-black text-lg rounded-lg transition-colors"
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
