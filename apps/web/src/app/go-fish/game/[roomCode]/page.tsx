'use client';

import { useEffect, useRef, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../lib/gameStore';
import { getPusherClient, getGameChannel, GO_FISH_EVENTS } from '@shared/lib/pusher';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import InvitePanel from '@shared/components/InvitePanel';
import GameEndedOverlay from '@shared/components/GameEndedOverlay';
import { Player, Card } from '../../types/game';
import { getCategoryInfo, getCategoriesInHand, CATEGORIES } from '../../data/cards';

export default function GoFishGamePage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [showAskModal, setShowAskModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [endHostName, setEndHostName] = useState<string | undefined>(undefined);
  const [endReason, setEndReason] = useState<'host-ended' | 'host-timeout' | 'inactivity' | 'unknown'>('unknown');
  const [hostDisconnected, setHostDisconnected] = useState(false);

  const joinedAsPlayerRef = useRef(false);
  const hostHeartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hostTimeoutIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHostHeartbeatRef = useRef<number>(Date.now());

  const HOST_HEARTBEAT_INTERVAL_MS = 10_000;
  const HOST_HEARTBEAT_TIMEOUT_MS = 30_000;

  const {
    status,
    players,
    deck,
    currentPlayerIndex,
    lastAction,
    askedCategory,
    askedPlayerId,
    winner,
    setRoomCode,
    setHostId,
    addPlayer,
    removePlayer,
    startGame,
    nextTurn,
    giveCards,
    drawCard,
    checkAndRemoveSets,
    checkGameOver,
    setLastAction,
    fullReset,
    updateGameState,
  } = useGameStore();

  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const myPlayer = players.find((p) => p.id === playerId);
  const myHand = myPlayer?.hand || [];
  const mySets = myPlayer?.sets || [];
  const myCategories = getCategoriesInHand(myHand);

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
    const spectator = sessionStorage.getItem('isSpectator') === 'true';

    if (!pid || !pname) {
      router.push(`/go-fish/join/${roomCode}`);
      return;
    }

    setPlayerId(pid);
    setPlayerName(pname);
    setIsHost(host);
    setIsSpectator(spectator);
    setRoomCode(roomCode);

    if (host) {
      setHostId(pid);
    }

    // Add self to players (spectators don't join the turn roster)
    const player: Player = {
      id: pid,
      name: pname,
      isHost: host,
      hand: [],
      sets: [],
      connectedAt: Date.now(),
    };
    if (!spectator) {
      joinedAsPlayerRef.current = true;
      addPlayer(player);
    }

    // Connect to Pusher
    const pusher = getPusherClient();
    const channel = pusher.subscribe(getGameChannel(roomCode));

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      if (!spectator) broadcast(GO_FISH_EVENTS.PLAYER_JOINED, { player });

      if (!host) {
        setTimeout(() => {
          broadcast(GO_FISH_EVENTS.REQUEST_STATE_SYNC, { requesterId: pid }).catch(() => {});
        }, 400);
      }
    });

    // Handle events
    channel.bind(GO_FISH_EVENTS.PLAYER_JOINED, (data: { player: Player }) => {
      if (data.player.id !== pid) {
        addPlayer(data.player);
      }
    });

    channel.bind(GO_FISH_EVENTS.PLAYER_LEFT, (data: { playerId: string }) => {
      removePlayer(data.playerId);
      if (data.playerId && data.playerId === useGameStore.getState().hostId) {
        setHostDisconnected(true);
      }
    });

    channel.bind(GO_FISH_EVENTS.GAME_STARTED, (data: any) => {
      updateGameState(data);
    });

    channel.bind(GO_FISH_EVENTS.GAME_STATE_UPDATE, (data: any) => {
      updateGameState(data);
    });

    channel.bind(GO_FISH_EVENTS.CARD_ASKED, (data: { category: string; fromId: string; toId: string; fromName: string; toName: string }) => {
      setActionMessage(`${data.fromName} asked ${data.toName} for ${data.category}`);
    });

    channel.bind(GO_FISH_EVENTS.CARDS_GIVEN, (data: { count: number; category: string; fromName: string; toName: string; newState: any }) => {
      setActionMessage(`${data.fromName} gave ${data.count} ${data.category} card(s) to ${data.toName}!`);
      updateGameState(data.newState);
    });

    channel.bind(GO_FISH_EVENTS.GO_FISH, (data: { playerName: string; newState: any }) => {
      setActionMessage(`${data.playerName} goes fishing!`);
      updateGameState(data.newState);
    });

    channel.bind(GO_FISH_EVENTS.SET_COMPLETED, (data: { playerName: string; category: string; newState: any }) => {
      setActionMessage(`${data.playerName} completed a ${data.category} set!`);
      updateGameState(data.newState);
    });

    channel.bind(GO_FISH_EVENTS.TURN_CHANGED, (data: { newState: any }) => {
      updateGameState(data.newState);
    });

    channel.bind(GO_FISH_EVENTS.GAME_OVER, (data: { winner: Player; newState: any }) => {
      updateGameState(data.newState);
    });

    channel.bind(GO_FISH_EVENTS.GAME_ENDED, (data: { reason?: string; hostName?: string }) => {
      setGameEnded(true);
      setEndHostName(data?.hostName);
      setEndReason((data?.reason as any) || 'unknown');
      updateGameState({ status: 'finished' as const });
    });

    channel.bind(GO_FISH_EVENTS.HOST_HEARTBEAT, () => {
      lastHostHeartbeatRef.current = Date.now();
      if (hostDisconnected) setHostDisconnected(false);
    });

    channel.bind(GO_FISH_EVENTS.HOST_TRANSFERRED, (data: { newHostId: string; newHostName?: string }) => {
      if (!data?.newHostId) return;
      setHostId(data.newHostId);
      updateGameState({
        hostId: data.newHostId,
        players: useGameStore.getState().players.map((p) => ({ ...p, isHost: p.id === data.newHostId })),
      });
      setHostDisconnected(false);

      const amIHost = data.newHostId === pid;
      setIsHost(amIHost);
      sessionStorage.setItem('isHost', amIHost ? 'true' : 'false');
    });

    channel.bind(GO_FISH_EVENTS.REQUEST_STATE_SYNC, (data: { requesterId: string }) => {
      if (!host) return;
      if (!data?.requesterId || data.requesterId === pid) return;
      const state = useGameStore.getState();
      broadcast(GO_FISH_EVENTS.STATE_SYNC, {
        targetId: data.requesterId,
        state: {
          roomCode: state.roomCode,
          status: state.status,
          players: state.players,
          hostId: state.hostId,
          deck: state.deck,
          currentPlayerIndex: state.currentPlayerIndex,
          lastAction: state.lastAction,
          askedCategory: state.askedCategory,
          askedPlayerId: state.askedPlayerId,
          winner: state.winner,
        },
      }).catch(() => {});
    });

    channel.bind(GO_FISH_EVENTS.STATE_SYNC, (data: { targetId: string; state: any }) => {
      if (data?.targetId !== pid) return;
      if (data?.state) updateGameState(data.state);
    });

    return () => {
      if (joinedAsPlayerRef.current) broadcast(GO_FISH_EVENTS.PLAYER_LEFT, { playerId: pid });
      fetch(`/api/rooms/${roomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave', playerId: pid }),
      }).catch(() => {});

      channel.unbind_all();
      pusher.unsubscribe(getGameChannel(roomCode));
      if (hostHeartbeatIntervalRef.current) clearInterval(hostHeartbeatIntervalRef.current);
      if (hostTimeoutIntervalRef.current) clearInterval(hostTimeoutIntervalRef.current);
      fullReset();
    };
  }, [roomCode, router]);

  // Host heartbeat + disconnect detection
  useEffect(() => {
    if (!isConnected) return;

    if (isHost) {
      if (hostHeartbeatIntervalRef.current) clearInterval(hostHeartbeatIntervalRef.current);
      hostHeartbeatIntervalRef.current = setInterval(() => {
        broadcast(GO_FISH_EVENTS.HOST_HEARTBEAT, {}).catch(() => {});
      }, HOST_HEARTBEAT_INTERVAL_MS);
    }

    if (hostTimeoutIntervalRef.current) clearInterval(hostTimeoutIntervalRef.current);
    hostTimeoutIntervalRef.current = setInterval(() => {
      const age = Date.now() - lastHostHeartbeatRef.current;
      if (!isHost && age > HOST_HEARTBEAT_TIMEOUT_MS) setHostDisconnected(true);
    }, 1_000);

    return () => {
      if (hostHeartbeatIntervalRef.current) clearInterval(hostHeartbeatIntervalRef.current);
      if (hostTimeoutIntervalRef.current) clearInterval(hostTimeoutIntervalRef.current);
    };
  }, [isConnected, isHost, broadcast]);

  const handleTakeOverHost = async () => {
    if (isSpectator) return;
    setIsHost(true);
    sessionStorage.setItem('isHost', 'true');
    setHostId(playerId);
    updateGameState({
      hostId: playerId,
      players: useGameStore.getState().players.map((p) => ({ ...p, isHost: p.id === playerId })),
    });
    setHostDisconnected(false);
    await broadcast(GO_FISH_EVENTS.HOST_TRANSFERRED, { newHostId: playerId, newHostName: playerName });
  };

  // Clear action message after delay
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  // Start game
  const handleStartGame = () => {
    if (isSpectator) return;
    if (players.length < 2) return;

    const store = useGameStore.getState();
    store.startGame();
    const newState = useGameStore.getState();

    broadcast(GO_FISH_EVENTS.GAME_STARTED, {
      status: newState.status,
      players: newState.players,
      deck: newState.deck,
      currentPlayerIndex: newState.currentPlayerIndex,
    });
  };

  // Ask for cards
  const handleAskForCards = () => {
    if (!selectedCategory || !selectedPlayer) return;

    const targetPlayer = players.find((p) => p.id === selectedPlayer);
    if (!targetPlayer) return;

    // Broadcast the ask
    broadcast(GO_FISH_EVENTS.CARD_ASKED, {
      category: selectedCategory,
      fromId: playerId,
      toId: selectedPlayer,
      fromName: myPlayer?.name,
      toName: targetPlayer.name,
    });

    // Check if target has cards of that category
    const targetCards = targetPlayer.hand.filter((c) => c.category === selectedCategory);

    if (targetCards.length > 0) {
      // Target has cards - give them to asking player
      const store = useGameStore.getState();
      store.giveCards(selectedPlayer, playerId, selectedCategory);

      // Check for completed sets
      store.checkAndRemoveSets(playerId);
      store.checkGameOver();

      const newState = useGameStore.getState();

      broadcast(GO_FISH_EVENTS.CARDS_GIVEN, {
        count: targetCards.length,
        category: selectedCategory,
        fromName: targetPlayer.name,
        toName: myPlayer?.name,
        newState: {
          players: newState.players,
          deck: newState.deck,
          status: newState.status,
          winner: newState.winner,
        },
      });

      // Check for sets
      const completedSets = newState.players.find((p) => p.id === playerId)?.sets || [];
      if (completedSets.length > mySets.length) {
        broadcast(GO_FISH_EVENTS.SET_COMPLETED, {
          playerName: myPlayer?.name,
          category: selectedCategory,
          newState: {
            players: newState.players,
          },
        });
      }
    } else {
      // Go Fish!
      const store = useGameStore.getState();
      const drawnCard = store.drawCard(playerId);
      store.checkAndRemoveSets(playerId);
      store.nextTurn();
      store.checkGameOver();

      const newState = useGameStore.getState();

      broadcast(GO_FISH_EVENTS.GO_FISH, {
        playerName: myPlayer?.name,
        newState: {
          players: newState.players,
          deck: newState.deck,
          currentPlayerIndex: newState.currentPlayerIndex,
          status: newState.status,
          winner: newState.winner,
        },
      });
    }

    setShowAskModal(false);
    setSelectedCategory(null);
    setSelectedPlayer(null);
  };

  // Leave game
  const handleLeave = () => {
    router.push('/go-fish');
  };

  const handleEndGame = async () => {
    setShowEndConfirm(false);
    const hostName = sessionStorage.getItem('playerName') || undefined;
    setGameEnded(true);
    setEndHostName(hostName);
    setEndReason('host-ended');
    updateGameState({ status: 'finished' as const });

    broadcast(GO_FISH_EVENTS.GAME_ENDED, { reason: 'host-ended', hostName }).catch(() => {});
    fetch(`/api/rooms/${roomCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', status: 'finished' }),
    }).catch(() => {});
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-600 to-blue-800 flex items-center justify-center">
        <LoadingSpinner message="Connecting..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-cyan-600 via-blue-600 to-blue-800 p-4">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleLeave}
              className="text-cyan-200 hover:text-yellow-400 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Leave
            </button>
            <h1 className="text-2xl font-bold text-yellow-400">GO FISH</h1>
            <div className="flex items-center gap-2">
              {isSpectator && (
                <span className="px-2 py-1 rounded-lg bg-black/20 text-white text-xs font-semibold">
                  Spectator
                </span>
              )}
              {isHost && status !== 'lobby' && (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold"
                >
                  End Game
                </button>
              )}
              <div className="text-cyan-200 text-sm">Deck: {deck.length}</div>
            </div>
          </div>
        </div>

        {hostDisconnected && !isHost && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="bg-yellow-500/10 border border-yellow-300/30 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="text-yellow-100">
                <div className="font-semibold">Host disconnected</div>
                <div className="text-sm text-yellow-100/80">Waiting for host… or take over to keep playing.</div>
              </div>
              {!isSpectator && (
                <button
                  onClick={handleTakeOverHost}
                  className="px-3 py-2 rounded-lg bg-yellow-400 text-blue-950 font-black hover:bg-yellow-300"
                >
                  Become Host
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Message */}
        {actionMessage && (
          <div className="max-w-4xl mx-auto mb-4">
            <div className="bg-yellow-500/90 text-blue-900 text-center py-2 px-4 rounded-lg font-semibold animate-pulse">
              {actionMessage}
            </div>
          </div>
        )}

        {/* Lobby */}
        {status === 'lobby' && (
          <div className="max-w-md mx-auto">
            <div className="bg-blue-950/80 rounded-2xl p-6 border border-blue-500/50 mb-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">Waiting for Players</h2>

              <div className="space-y-3 mb-6">
                {players.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-blue-900/50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {['🐟', '🐠', '🐡', '🦈'][i % 4]}
                      </span>
                      <span className="text-white">{p.name}</span>
                    </div>
                    {p.isHost && (
                      <span className="text-xs bg-yellow-500 text-blue-900 px-2 py-0.5 rounded">
                        HOST
                      </span>
                    )}
                  </div>
                ))}
                {players.length < 4 && (
                  <div className="flex items-center justify-center bg-blue-900/30 rounded-lg p-3 border-2 border-dashed border-blue-500">
                    <span className="text-blue-400">Waiting for more players...</span>
                  </div>
                )}
              </div>

              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={players.length < 2}
                  className={`w-full py-3 rounded-lg font-bold text-lg transition-colors ${
                    players.length >= 2
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-blue-900'
                      : 'bg-blue-800 text-blue-500 cursor-not-allowed'
                  }`}
                >
                  {players.length < 2 ? 'Need 2+ Players' : 'Start Game'}
                </button>
              )}

              {!isHost && (
                <p className="text-center text-blue-300">Waiting for host to start...</p>
              )}
            </div>

            <InvitePanel roomCode={roomCode} gameType="go-fish" />
          </div>
        )}

        {/* Game Play */}
        {status === 'playing' && (
          <div className="max-w-4xl mx-auto">
            {/* Other Players */}
            <div className="flex justify-center gap-4 mb-6 flex-wrap">
              {players.filter((p) => p.id !== playerId).map((p, i) => (
                <div
                  key={p.id}
                  className={`bg-blue-900/50 rounded-xl p-4 min-w-[140px] ${
                    currentPlayer?.id === p.id ? 'ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl">{['🐟', '🐠', '🐡', '🦈'][i % 4]}</span>
                    <p className="text-white font-semibold mt-1">{p.name}</p>
                    <p className="text-cyan-300 text-sm">{p.hand.length} cards</p>
                    <p className="text-yellow-400 text-sm">{p.sets.length} sets</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Turn Indicator */}
            <div className="text-center mb-4">
              <p className={`text-lg font-semibold ${isMyTurn ? 'text-yellow-400' : 'text-cyan-300'}`}>
                {isMyTurn ? "Your turn! Ask for cards" : `${currentPlayer?.name || 'Player'}'s turn`}
              </p>
            </div>

            {/* My Sets */}
            {mySets.length > 0 && (
              <div className="bg-blue-900/30 rounded-xl p-4 mb-4">
                <h3 className="text-yellow-400 font-semibold mb-2">Your Sets ({mySets.length})</h3>
                <div className="flex gap-2 flex-wrap">
                  {mySets.map((set, i) => {
                    const catInfo = getCategoryInfo(set.category);
                    return (
                      <div key={i} className="bg-green-600/50 rounded-lg px-3 py-2 text-white text-sm">
                        {catInfo?.emoji} {set.category}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* My Hand */}
            <div className="bg-blue-950/80 rounded-2xl p-4 border border-blue-500/50">
              <h3 className="text-yellow-400 font-semibold mb-3">Your Hand ({myHand.length} cards)</h3>

              {myHand.length === 0 ? (
                <p className="text-blue-400 text-center py-4">No cards in hand</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {myHand.map((card) => (
                    <div
                      key={card.id}
                      className="bg-white rounded-lg p-2 text-center shadow-lg"
                    >
                      <span className="text-2xl">{card.emoji}</span>
                      <p className="text-xs text-gray-600 truncate">{card.character}</p>
                      <p className="text-xs text-blue-600 font-semibold truncate">{card.category}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Ask Button */}
              {isMyTurn && myHand.length > 0 && (
                <button
                  onClick={() => setShowAskModal(true)}
                  className="w-full mt-4 py-3 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold rounded-lg"
                >
                  Ask for Cards
                </button>
              )}
            </div>
          </div>
        )}

        {/* Ask Modal */}
        {showAskModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-blue-950 rounded-2xl p-6 max-w-md w-full border-4 border-yellow-500">
              <h2 className="text-2xl font-bold text-yellow-400 text-center mb-4">
                Ask for Cards
              </h2>

              {/* Select Category */}
              <div className="mb-4">
                <h3 className="text-cyan-200 mb-2">What category do you want?</h3>
                <div className="grid grid-cols-2 gap-2">
                  {myCategories.map((cat) => {
                    const catInfo = getCategoryInfo(cat);
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`p-3 rounded-lg text-left transition-colors ${
                          selectedCategory === cat
                            ? 'bg-yellow-500 text-blue-900'
                            : 'bg-blue-800 text-white hover:bg-blue-700'
                        }`}
                      >
                        <span className="text-xl mr-2">{catInfo?.emoji}</span>
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Select Player */}
              {selectedCategory && (
                <div className="mb-4">
                  <h3 className="text-cyan-200 mb-2">Who do you want to ask?</h3>
                  <div className="space-y-2">
                    {players.filter((p) => p.id !== playerId).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPlayer(p.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedPlayer === p.id
                            ? 'bg-yellow-500 text-blue-900'
                            : 'bg-blue-800 text-white hover:bg-blue-700'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAskModal(false);
                    setSelectedCategory(null);
                    setSelectedPlayer(null);
                  }}
                  className="flex-1 py-3 bg-blue-800 hover:bg-blue-700 text-white font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAskForCards}
                  disabled={!selectedCategory || !selectedPlayer}
                  className={`flex-1 py-3 font-bold rounded-lg ${
                    selectedCategory && selectedPlayer
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-blue-900'
                      : 'bg-blue-800 text-blue-500 cursor-not-allowed'
                  }`}
                >
                  Ask!
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Game Over */}
        {status === 'finished' && winner && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-blue-950 rounded-2xl p-8 max-w-md w-full border-4 border-yellow-500 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                {winner.name} Wins!
              </h2>
              <p className="text-cyan-300 mb-4">
                with {winner.sets.length} sets!
              </p>

              {/* Final Scores */}
              <div className="bg-blue-900/50 rounded-lg p-4 mb-6">
                <h3 className="text-cyan-300 text-sm mb-2">Final Scores</h3>
                <div className="space-y-2">
                  {[...players].sort((a, b) => b.sets.length - a.sets.length).map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center">
                      <span className="text-white">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '} {p.name}
                      </span>
                      <span className="text-yellow-400 font-bold">{p.sets.length} sets</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleLeave}
                  className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-lg"
                >
                  Back to Lobby
                </button>
                {isHost && (
                  <button
                    onClick={handleStartGame}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold rounded-lg"
                  >
                    Play Again
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {showEndConfirm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-blue-950 rounded-2xl p-6 max-w-md w-full border border-blue-500/50">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2 text-center">End game?</h2>
              <p className="text-cyan-200/80 text-sm text-center mb-6">
                This will stop the current match for everyone in the room.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndGame}
                  className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-black rounded-lg"
                >
                  End Game
                </button>
              </div>
            </div>
          </div>
        )}

        {gameEnded && (
          <GameEndedOverlay
            title="Game Ended"
            reason={endReason}
            hostName={endHostName}
            primaryAction={{ label: 'Back to Lobby', href: '/go-fish' }}
            secondaryAction={
              isHost
                ? {
                    label: 'Close',
                    onClick: () => setGameEnded(false),
                  }
                : undefined
            }
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
