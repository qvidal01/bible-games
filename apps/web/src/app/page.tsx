'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import { isValidRoomCode } from '@shared/lib/validation';
import { PublicRoom, GameType } from '@shared/types';

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  // Fetch public rooms on mount
  useEffect(() => {
    fetchPublicRooms();
  }, []);

  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setPublicRooms(data.rooms || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
    setLoadingRooms(false);
  };

  const handleJoinWithCode = async () => {
    const upperCode = joinCode.toUpperCase();
    if (!isValidRoomCode(upperCode)) {
      setJoinError('Please enter a valid 6-character room code');
      return;
    }

    setIsJoining(true);
    setJoinError('');

    try {
      const res = await fetch(`/api/rooms/${upperCode}`);
      const data = await res.json();

      if (!data.exists) {
        setJoinError('Room not found. Please check the code.');
        setIsJoining(false);
        return;
      }

      // Route to the correct game type
      router.push(`/${data.room.gameType}/join/${upperCode}`);
    } catch (err) {
      setJoinError('Failed to find room. Please try again.');
      setIsJoining(false);
    }
  };

  const handleJoinRoom = (room: PublicRoom) => {
    router.push(`/${room.gameType}/join/${room.code}`);
  };

  const getGameIcon = (gameType: GameType) => {
    switch (gameType) {
      case 'jeopardy':
        return '?';
      case 'family-feud':
        return 'VS';
      default:
        return '?';
    }
  };

  const getGameColor = (gameType: GameType) => {
    switch (gameType) {
      case 'jeopardy':
        return 'from-blue-600 to-blue-800';
      case 'family-feud':
        return 'from-red-600 to-red-800';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900">
        {/* Header */}
        <header className="text-center pt-8 pb-6 px-4">
          <h1
            className="text-5xl md:text-7xl font-bold text-yellow-400 mb-3 tracking-wide jeopardy-title"
          >
            BIBLE GAMES
          </h1>
          <p className="text-blue-200 text-xl">JW Edition</p>
          <p className="text-blue-300 text-sm mt-2 max-w-md mx-auto">
            Family-friendly Bible trivia games for congregation events, family worship, and more!
          </p>
        </header>

        {/* Game Selection */}
        <section className="max-w-5xl mx-auto px-4 pb-8">
          <h2 className="text-2xl font-bold text-yellow-400 text-center mb-6">Choose Your Game</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Jeopardy Card */}
            <div
              onClick={() => router.push('/jeopardy')}
              className="game-card bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl p-6 border-2 border-blue-500 cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <span className="text-blue-900 text-3xl font-bold">?</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Bible Jeopardy</h3>
                  <p className="text-blue-300">Classic trivia format</p>
                </div>
              </div>
              <ul className="text-blue-200 text-sm space-y-1 mb-4">
                <li>• 20 categories with 5 questions each</li>
                <li>• Daily Doubles with custom wagers</li>
                <li>• Final Jeopardy round</li>
                <li>• Individual or Team play</li>
                <li>• Study mode for solo practice</li>
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 font-semibold">2-15 players</span>
                <span className="bg-yellow-500 text-blue-900 px-4 py-2 rounded-lg font-bold">
                  PLAY
                </span>
              </div>
            </div>

            {/* Family Feud Card */}
            <div
              onClick={() => router.push('/family-feud')}
              className="game-card bg-gradient-to-br from-red-700 to-red-900 rounded-2xl p-6 border-2 border-red-500 cursor-pointer"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-yellow-500 rounded-xl flex items-center justify-center">
                  <span className="text-red-900 text-2xl font-bold">VS</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Bible Family Feud</h3>
                  <p className="text-red-300">Survey says...</p>
                </div>
              </div>
              <ul className="text-red-200 text-sm space-y-1 mb-4">
                <li>• 40+ survey-style questions</li>
                <li>• Team vs Team competition</li>
                <li>• Face-off and steal mechanics</li>
                <li>• Strike system</li>
                <li>• Points based on answer popularity</li>
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400 font-semibold">4-16 players</span>
                <span className="bg-yellow-500 text-red-900 px-4 py-2 rounded-lg font-bold">
                  PLAY
                </span>
              </div>
            </div>

            {/* Kids Bible Trivia - Coming Soon */}
            <div className="relative game-card bg-gradient-to-br from-green-700 to-green-900 rounded-2xl p-6 border-2 border-green-500/50 opacity-90">
              {/* Coming Soon Banner */}
              <div className="absolute -top-3 -right-3 z-10">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg transform rotate-12 animate-pulse">
                  COMING SOON
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-yellow-500/80 rounded-xl flex items-center justify-center">
                  <svg className="w-9 h-9 text-green-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Kids Bible Trivia</h3>
                  <p className="text-green-300">Picture guessing fun!</p>
                </div>
              </div>
              <ul className="text-green-200 text-sm space-y-1 mb-4">
                <li>• Picture-based character guessing</li>
                <li>• Age-appropriate questions</li>
                <li>• Fun animations and sounds</li>
                <li>• Multiple difficulty levels</li>
                <li>• Perfect for family worship</li>
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400/70 font-semibold">All ages</span>
                <span className="bg-green-600/50 text-green-200 px-4 py-2 rounded-lg font-bold border border-green-500/50">
                  SOON
                </span>
              </div>
            </div>

            {/* Bible Escape Room - Coming Soon */}
            <div className="relative game-card bg-gradient-to-br from-purple-700 to-purple-900 rounded-2xl p-6 border-2 border-purple-500/50 opacity-90">
              {/* Coming Soon Banner */}
              <div className="absolute -top-3 -right-3 z-10">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-4 py-1.5 rounded-full shadow-lg transform rotate-12 animate-pulse">
                  COMING SOON
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-yellow-500/80 rounded-xl flex items-center justify-center">
                  <svg className="w-9 h-9 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Bible Escape Room</h3>
                  <p className="text-purple-300">Solve clues to escape!</p>
                </div>
              </div>
              <ul className="text-purple-200 text-sm space-y-1 mb-4">
                <li>• Interactive puzzle rooms</li>
                <li>• Bible-based clues and riddles</li>
                <li>• Scenic locations and animations</li>
                <li>• Team collaboration challenges</li>
                <li>• Multiple themed scenarios</li>
              </ul>
              <div className="flex items-center justify-between">
                <span className="text-yellow-400/70 font-semibold">2-8 players</span>
                <span className="bg-purple-600/50 text-purple-200 px-4 py-2 rounded-lg font-bold border border-purple-500/50">
                  SOON
                </span>
              </div>
            </div>
          </div>

          {/* Quick Join */}
          <div className="bg-blue-950/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-700/50 mb-8">
            <h3 className="text-xl font-bold text-yellow-400 text-center mb-4">Join with Code</h3>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => {
                  setJoinCode(e.target.value.toUpperCase());
                  setJoinError('');
                }}
                placeholder="Enter 6-letter code"
                className="flex-1 px-4 py-3 rounded-lg bg-blue-900/50 border border-blue-600 text-white
                           placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-yellow-400
                           uppercase tracking-widest text-center text-xl"
                maxLength={6}
                autoComplete="off"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinWithCode()}
              />
              <button
                onClick={handleJoinWithCode}
                disabled={isJoining}
                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold rounded-lg
                           transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
            {joinError && (
              <p className="text-red-400 text-sm text-center mt-2">{joinError}</p>
            )}
          </div>

          {/* Public Rooms */}
          <div className="bg-blue-950/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-700/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-yellow-400">Public Rooms</h3>
              <button
                onClick={fetchPublicRooms}
                disabled={loadingRooms}
                className="text-blue-300 hover:text-blue-200 text-sm flex items-center gap-1"
              >
                <svg className={`w-4 h-4 ${loadingRooms ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>

            {loadingRooms ? (
              <LoadingSpinner message="Loading rooms..." size="sm" />
            ) : publicRooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-blue-400 mb-2">No public rooms available</p>
                <p className="text-blue-500 text-sm">Create a new game to get started!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {publicRooms.map((room) => (
                  <div
                    key={room.code}
                    className={`bg-gradient-to-r ${getGameColor(room.gameType)} rounded-lg p-4 border border-opacity-50 hover:border-opacity-100 transition-colors cursor-pointer`}
                    onClick={() => handleJoinRoom(room)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                          <span className="text-blue-900 font-bold text-sm">{getGameIcon(room.gameType)}</span>
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">{room.roomName}</h4>
                          <p className="text-gray-300 text-sm">Hosted by {room.hostName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs bg-black/20 text-white px-2 py-0.5 rounded capitalize">
                          {room.gameType.replace('-', ' ')}
                        </span>
                        <p className="text-gray-300 text-sm mt-1">
                          {room.playerCount}/{room.maxPlayers} players
                        </p>
                      </div>
                    </div>
                    {room.description && (
                      <p className="text-gray-300 text-sm mt-2">{room.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 px-4 border-t border-blue-800">
          <p className="text-blue-400 text-sm mb-3">
            Based on teachings from jw.org
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="mailto:info@aiqso.io?subject=Bible%20Games%20Feedback"
              className="text-blue-300 hover:text-yellow-400 text-sm flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Feedback
            </a>
            <span className="text-blue-700">|</span>
            <a
              href="https://github.com/qvidal01/bible-games"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-yellow-400 text-sm flex items-center gap-1.5 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>
          <p className="text-blue-500 text-xs mt-4">
            games.aiqso.io
          </p>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
