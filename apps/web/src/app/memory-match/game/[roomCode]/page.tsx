'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../lib/gameStore';
import { getPusherClient, getGameChannel, MEMORY_MATCH_EVENTS } from '@shared/lib/pusher';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import InvitePanel from '@shared/components/InvitePanel';
import { Player, GridSize, GRID_CONFIGS } from '../../types/game';
import { getCharacter, generateCards } from '../../data/characters';

export default function MemoryMatchGamePage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);

  const {
    status,
    players,
    cards,
    gridSize,
    currentPlayerIndex,
    firstCard,
    secondCard,
    showHints,
    winner,
    setRoomCode,
    setHostId,
    addPlayer,
    removePlayer,
    setStatus,
    startGame,
    flipCard,
    checkForMatch,
    resetFlippedCards,
    nextTurn,
    checkGameOver,
    setGridSize,
    setShowHints,
    fullReset,
    updateGameState,
  } = useGameStore();

  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;

  // Broadcast helper
  const broadcast = useCallback(async (event: string, data: any) => {
    try {
      await fetch('/api/game/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, event, data }),
      });
    } catch (err) {
      console.error('Broadcast failed:', err);
    }
  }, [roomCode]);

  // Initialize connection
  useEffect(() => {
    const pid = sessionStorage.getItem('playerId');
    const pname = sessionStorage.getItem('playerName');
    const host = sessionStorage.getItem('isHost') === 'true';
    const storedGridSize = sessionStorage.getItem('mm-gridSize') as GridSize;
    const storedShowHints = sessionStorage.getItem('mm-showHints');

    if (!pid || !pname) {
      router.push(`/memory-match/join/${roomCode}`);
      return;
    }

    setPlayerId(pid);
    setIsHost(host);
    setRoomCode(roomCode);

    if (host) {
      setHostId(pid);
      if (storedGridSize) setGridSize(storedGridSize);
      if (storedShowHints) setShowHints(storedShowHints === 'true');
    }

    // Add self to players
    const player: Player = {
      id: pid,
      name: pname,
      isHost: host,
      score: 0,
      connectedAt: Date.now(),
    };
    addPlayer(player);

    // Connect to Pusher
    const pusher = getPusherClient();
    const channel = pusher.subscribe(getGameChannel(roomCode));

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      broadcast(MEMORY_MATCH_EVENTS.PLAYER_JOINED, { player });
    });

    // Handle events
    channel.bind(MEMORY_MATCH_EVENTS.PLAYER_JOINED, (data: { player: Player }) => {
      if (data.player.id !== pid) {
        addPlayer(data.player);
      }
    });

    channel.bind(MEMORY_MATCH_EVENTS.PLAYER_LEFT, (data: { playerId: string }) => {
      removePlayer(data.playerId);
    });

    channel.bind(MEMORY_MATCH_EVENTS.GAME_STARTED, (data: any) => {
      updateGameState(data);
    });

    channel.bind(MEMORY_MATCH_EVENTS.GAME_STATE_UPDATE, (data: any) => {
      updateGameState(data);
    });

    channel.bind(MEMORY_MATCH_EVENTS.CARD_FLIPPED, (data: { cardIndex: number; newState: any }) => {
      updateGameState(data.newState);
    });

    channel.bind(MEMORY_MATCH_EVENTS.MATCH_FOUND, (data: { newState: any }) => {
      updateGameState(data.newState);
    });

    channel.bind(MEMORY_MATCH_EVENTS.NO_MATCH, (data: { newState: any }) => {
      updateGameState(data.newState);
    });

    channel.bind(MEMORY_MATCH_EVENTS.TURN_CHANGED, (data: { newState: any }) => {
      updateGameState(data.newState);
    });

    channel.bind(MEMORY_MATCH_EVENTS.GAME_OVER, (data: { winner: Player; newState: any }) => {
      updateGameState(data.newState);
    });

    return () => {
      broadcast(MEMORY_MATCH_EVENTS.PLAYER_LEFT, { playerId: pid });
      channel.unbind_all();
      pusher.unsubscribe(getGameChannel(roomCode));
      fullReset();
    };
  }, [roomCode, router]);

  // Handle card click
  const handleCardClick = async (cardIndex: number) => {
    if (!isMyTurn || status !== 'playing') return;
    if (cards[cardIndex].isFlipped || cards[cardIndex].isMatched) return;
    if (firstCard !== null && secondCard !== null) return;

    // Flip the card
    const newCards = [...cards];
    newCards[cardIndex] = { ...newCards[cardIndex], isFlipped: true };

    if (firstCard === null) {
      // First card flipped
      const newState = { cards: newCards, firstCard: cardIndex };
      updateGameState(newState);
      broadcast(MEMORY_MATCH_EVENTS.CARD_FLIPPED, { cardIndex, newState });
    } else {
      // Second card flipped - check for match
      const newState = { cards: newCards, secondCard: cardIndex, status: 'checking' as const };
      updateGameState(newState);
      broadcast(MEMORY_MATCH_EVENTS.CARD_FLIPPED, { cardIndex, newState });

      // Check match after a delay
      setTimeout(() => {
        const matched = newCards[firstCard].characterId === newCards[cardIndex].characterId;

        if (matched) {
          // Mark as matched
          const matchedCards = [...newCards];
          matchedCards[firstCard] = { ...matchedCards[firstCard], isMatched: true, matchedBy: playerId };
          matchedCards[cardIndex] = { ...matchedCards[cardIndex], isMatched: true, matchedBy: playerId };

          const newPlayers = players.map((p) =>
            p.id === playerId ? { ...p, score: p.score + 1 } : p
          );

          // Check if game over
          const allMatched = matchedCards.every((c) => c.isMatched);
          if (allMatched) {
            const winner = newPlayers.reduce((prev, curr) =>
              curr.score > prev.score ? curr : prev
            );
            const gameOverState = {
              cards: matchedCards,
              players: newPlayers,
              firstCard: null,
              secondCard: null,
              status: 'finished' as const,
              winner,
            };
            updateGameState(gameOverState);
            broadcast(MEMORY_MATCH_EVENTS.GAME_OVER, { winner, newState: gameOverState });
          } else {
            const matchState = {
              cards: matchedCards,
              players: newPlayers,
              firstCard: null,
              secondCard: null,
              status: 'playing' as const,
            };
            updateGameState(matchState);
            broadcast(MEMORY_MATCH_EVENTS.MATCH_FOUND, { newState: matchState });
          }
        } else {
          // No match - flip cards back
          const resetCards = [...newCards];
          resetCards[firstCard] = { ...resetCards[firstCard], isFlipped: false };
          resetCards[cardIndex] = { ...resetCards[cardIndex], isFlipped: false };

          const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
          const noMatchState = {
            cards: resetCards,
            firstCard: null,
            secondCard: null,
            currentPlayerIndex: nextPlayerIndex,
            status: 'playing' as const,
          };
          updateGameState(noMatchState);
          broadcast(MEMORY_MATCH_EVENTS.NO_MATCH, { newState: noMatchState });
        }
      }, 1000);
    }
  };

  // Start game
  const handleStartGame = () => {
    if (players.length < 2) return;

    const newCards = generateCards(gridSize);
    const newState = {
      status: 'playing' as const,
      cards: newCards,
      gridSize: gridSize,
      showHints: showHints,
      currentPlayerIndex: 0,
      firstCard: null,
      secondCard: null,
      winner: null,
      players: players.map((p) => ({ ...p, score: 0 })),
    };

    updateGameState(newState);
    broadcast(MEMORY_MATCH_EVENTS.GAME_STARTED, newState);
  };

  // Leave game
  const handleLeave = () => {
    router.push('/memory-match');
  };

  const { rows, cols } = GRID_CONFIGS[gridSize];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-600 to-purple-700 flex items-center justify-center">
        <LoadingSpinner message="Connecting..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-pink-600 via-purple-600 to-indigo-700 p-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleLeave}
              className="text-pink-200 hover:text-yellow-400 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Leave
            </button>
            <h1 className="text-2xl font-bold text-yellow-400">MEMORY MATCH</h1>
            <div className="text-pink-200 text-sm">
              {gridSize}
            </div>
          </div>
        </div>

        {/* Lobby */}
        {status === 'lobby' && (
          <div className="max-w-md mx-auto">
            <div className="bg-purple-950/80 rounded-2xl p-6 border border-purple-500/50 mb-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">Waiting for Players</h2>

              <div className="space-y-3 mb-6">
                {players.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-purple-900/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {['🦁', '🐻', '🦊', '🐰'][i % 4]}
                      </span>
                      <span className="text-white">{p.name}</span>
                    </div>
                    {p.isHost && (
                      <span className="text-xs bg-yellow-500 text-purple-900 px-2 py-0.5 rounded">
                        HOST
                      </span>
                    )}
                  </div>
                ))}
                {players.length < 4 && (
                  <div className="flex items-center justify-center bg-purple-900/30 rounded-lg p-3 border-2 border-dashed border-purple-500">
                    <span className="text-purple-400">Waiting for more players...</span>
                  </div>
                )}
              </div>

              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={players.length < 2}
                  className={`w-full py-3 rounded-lg font-bold text-lg transition-colors ${
                    players.length >= 2
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-purple-900'
                      : 'bg-purple-800 text-purple-500 cursor-not-allowed'
                  }`}
                >
                  {players.length < 2 ? 'Need 2+ Players' : 'Start Game'}
                </button>
              )}

              {!isHost && (
                <p className="text-center text-purple-300">Waiting for host to start...</p>
              )}
            </div>

            <InvitePanel roomCode={roomCode} gameType="memory-match" />
          </div>
        )}

        {/* Game Board */}
        {(status === 'playing' || status === 'checking') && (
          <div className="max-w-4xl mx-auto">
            {/* Scoreboard */}
            <div className="flex justify-center gap-4 mb-4 flex-wrap">
              {players.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                    currentPlayerIndex === i
                      ? 'bg-yellow-500 text-purple-900'
                      : 'bg-purple-900/50 text-purple-200'
                  }`}
                >
                  <span className="text-xl">{['🦁', '🐻', '🦊', '🐰'][i % 4]}</span>
                  <span className="font-semibold">{p.name}</span>
                  <span className="bg-purple-700/50 px-2 py-0.5 rounded text-sm">
                    {p.score} pairs
                  </span>
                </div>
              ))}
            </div>

            {/* Turn Indicator */}
            <div className="text-center mb-4">
              <p className={`text-lg font-semibold ${isMyTurn ? 'text-yellow-400' : 'text-purple-300'}`}>
                {isMyTurn ? "Your turn! Flip two cards" : `${currentPlayer?.name || 'Player'}'s turn`}
              </p>
            </div>

            {/* Card Grid */}
            <div
              className="grid gap-2 md:gap-3 max-w-2xl mx-auto"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {cards.map((card, index) => {
                const character = getCharacter(card.characterId);
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(index)}
                    disabled={!isMyTurn || card.isFlipped || card.isMatched || status === 'checking'}
                    className={`aspect-square rounded-xl transition-all duration-300 transform ${
                      card.isMatched
                        ? 'opacity-50 scale-95'
                        : card.isFlipped
                        ? `${character?.color || 'bg-white'} scale-105`
                        : isMyTurn && status === 'playing'
                        ? 'bg-purple-800 hover:bg-purple-700 hover:scale-105 cursor-pointer'
                        : 'bg-purple-900/50'
                    }`}
                    style={{
                      perspective: '1000px',
                    }}
                  >
                    {(card.isFlipped || card.isMatched) && character ? (
                      <div className="flex flex-col items-center justify-center h-full p-1">
                        <span className="text-3xl md:text-4xl">{character.emoji}</span>
                        {showHints && (
                          <span className="text-xs mt-1 text-center font-semibold text-gray-800 truncate w-full px-1">
                            {character.name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-3xl md:text-4xl">❓</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Game Over */}
        {status === 'finished' && winner && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-purple-950 rounded-2xl p-8 max-w-md w-full border-4 border-yellow-500 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                {winner.name} Wins!
              </h2>
              <p className="text-purple-300 mb-4">
                with {winner.score} pairs!
              </p>

              {/* Final Scores */}
              <div className="bg-purple-900/50 rounded-lg p-4 mb-6">
                <h3 className="text-purple-300 text-sm mb-2">Final Scores</h3>
                <div className="space-y-2">
                  {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center">
                      <span className="text-white">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '} {p.name}
                      </span>
                      <span className="text-yellow-400 font-bold">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleLeave}
                  className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white font-semibold rounded-lg"
                >
                  Back to Lobby
                </button>
                {isHost && (
                  <button
                    onClick={handleStartGame}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-purple-900 font-bold rounded-lg"
                  >
                    Play Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
