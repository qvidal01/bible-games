'use client';

import { use, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import InvitePanel from '@shared/components/InvitePanel';
import { getGameChannel, getPusherClient, KIDS_TRIVIA_EVENTS } from '@shared/lib/pusher';
import { kidsTriviaQuestions } from '@games/kids-trivia/questions';
import { pickNextQuestionId } from '../../lib/questionPicker';
import { createRound, useKidsTriviaStore } from '../../lib/gameStore';
import type { KidsTriviaDifficulty } from '../../types/game';
import { KidsTriviaScene } from '../../lib/scenes';
import GameEndedOverlay from '@shared/components/GameEndedOverlay';
import {
  isKidsTriviaSfxEnabled,
  playKidsTriviaSfx,
  setKidsTriviaSfxEnabled,
  unlockKidsTriviaAudio,
} from '../../lib/sfx';
import { isRealtimeClientConfigured } from '@shared/lib/env';

type AnswerSubmittedPayload = {
  playerId: string;
  playerName: string;
  answer: string;
  time: number;
};

function getQuestionById(id: string) {
  return kidsTriviaQuestions.find((q) => q.id === id) ?? kidsTriviaQuestions[0]!;
}

export default function KidsTriviaGamePage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();

  const realtimeConfigured = isRealtimeClientConfigured();

  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [isSpectator, setIsSpectator] = useState(false);
  const [connected, setConnected] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(isKidsTriviaSfxEnabled());
  const [now, setNow] = useState(() => Date.now());
  const [showHint, setShowHint] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [endReason, setEndReason] = useState<'host-ended' | 'completed' | 'unknown'>('unknown');
  const [endHostName, setEndHostName] = useState<string | undefined>(undefined);
  const [hostDisconnected, setHostDisconnected] = useState(false);

  const lastCountdownSecondRef = useRef<number | null>(null);
  const lastRevealAtRef = useRef<number | null>(null);
  const joinedAsPlayerRef = useRef(false);
  const hostHeartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hostTimeoutIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHostHeartbeatRef = useRef<number>(Date.now());

  const HOST_HEARTBEAT_INTERVAL_MS = 10_000;
  const HOST_HEARTBEAT_TIMEOUT_MS = 30_000;

  const {
    status,
    players,
    settings,
    round,
    usedQuestionIds,
    setRoomCode,
    setHostId,
    setStatus,
    setSettings,
    addPlayer,
    removePlayer,
    updatePlayerScore,
    startRound,
    submitAnswer,
    closeRound,
    revealAnswer,
    addUsedQuestionId,
    applySyncedState,
    fullReset,
  } = useKidsTriviaStore();

  const me = useMemo(() => players.find((p) => p.id === playerId) ?? null, [players, playerId]);
  const activeQuestion = round ? getQuestionById(round.questionId) : null;
  const myAnswer = round ? round.answersByPlayerId[playerId] : undefined;
  const roundClosed = !!round?.closedAt;

  const remainingSeconds = useMemo(() => {
    if (!round) return null;
    const elapsed = (now - round.startedAt) / 1000;
    return Math.max(0, Math.ceil(settings.timerSeconds - elapsed));
  }, [now, round, settings.timerSeconds]);

  const hintUnlocked = useMemo(() => {
    if (!round) return false;
    const elapsed = (now - round.startedAt) / 1000;
    return elapsed >= settings.hintDelaySeconds;
  }, [now, round, settings.hintDelaySeconds]);

  const hintUnlockInSeconds = useMemo(() => {
    if (!round) return 0;
    const elapsed = (now - round.startedAt) / 1000;
    return Math.max(0, Math.ceil(settings.hintDelaySeconds - elapsed));
  }, [now, round, settings.hintDelaySeconds]);

  useEffect(() => {
    if (!round || status !== 'playing') return;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [round, status]);

  // Auto-show hint when it unlocks (per room setting)
  useEffect(() => {
    if (!round || status !== 'playing') return;
    if (!settings.autoShowHint) return;
    if (hintUnlocked) setShowHint(true);
  }, [hintUnlocked, round, settings.autoShowHint, status]);

  const broadcast = useCallback(
    async (event: string, data: unknown) => {
      try {
        await fetch('/api/game/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode, event, data }),
        });
      } catch (error) {
        console.error('Failed to broadcast event:', error);
      }
    },
    [roomCode],
  );

  useEffect(() => {
    fullReset();
  }, [roomCode, fullReset]);

  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    const storedPlayerName = sessionStorage.getItem('playerName');
    const storedIsHost = sessionStorage.getItem('isHost') === 'true';
    const storedIsSpectator = sessionStorage.getItem('isSpectator') === 'true';

    if (!storedPlayerId || !storedPlayerName) {
      router.push('/kids-trivia');
      return;
    }

    setRoomCode(roomCode);
    setPlayerId(storedPlayerId);
    setPlayerName(storedPlayerName);
    setIsHost(storedIsHost);
    setIsSpectator(storedIsSpectator);
    if (storedIsHost) setHostId(storedPlayerId);

    const playerPayload = {
      id: storedPlayerId,
      name: storedPlayerName,
      isHost: storedIsHost,
      score: 0,
      connectedAt: Date.now(),
    };

    if (!storedIsSpectator) {
      joinedAsPlayerRef.current = true;
      addPlayer(playerPayload);
      broadcast(KIDS_TRIVIA_EVENTS.PLAYER_JOINED, playerPayload).catch(() => {});
    } else {
      joinedAsPlayerRef.current = false;
    }
  }, [addPlayer, broadcast, roomCode, router, setHostId, setRoomCode]);

  useEffect(() => {
    if (!playerId || !realtimeConfigured) return;

    const pusher = getPusherClient();
    const channelName = getGameChannel(roomCode);
    const channel = pusher.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => setConnected(true));
    channel.bind('pusher:subscription_error', () => setConnected(false));

    channel.bind(KIDS_TRIVIA_EVENTS.PLAYER_JOINED, (data: any) => {
      if (!data?.id) return;
      addPlayer(data);
    });

    channel.bind(KIDS_TRIVIA_EVENTS.PLAYER_LEFT, (data: { playerId: string }) => {
      if (!data?.playerId) return;
      removePlayer(data.playerId);
      if (data.playerId === useKidsTriviaStore.getState().hostId) {
        setHostDisconnected(true);
      }
    });

    channel.bind(KIDS_TRIVIA_EVENTS.SETTINGS_UPDATED, (data: Partial<typeof settings>) => {
      setSettings(data);
    });

    channel.bind(KIDS_TRIVIA_EVENTS.QUESTION_SET, (data: { round: any; usedQuestionIds?: string[] }) => {
      if (!data?.round?.questionId) return;
      startRound(data.round);
      setShowHint(false);
      if (Array.isArray(data.usedQuestionIds)) {
        applySyncedState({ usedQuestionIds: data.usedQuestionIds });
      } else {
        addUsedQuestionId(data.round.questionId);
      }
      lastCountdownSecondRef.current = null;
      lastRevealAtRef.current = null;
    });

    channel.bind(KIDS_TRIVIA_EVENTS.ANSWER_SUBMITTED, (data: AnswerSubmittedPayload) => {
      if (!data?.playerId || !data.answer) return;
      submitAnswer(data.playerId, data.answer);

      if (isHost) {
        const state = useKidsTriviaStore.getState();
        const currentRound = state.round;
        if (!currentRound) return;
        if (state.status !== 'playing') return;
        if (currentRound.closedAt) return;

        const question = getQuestionById(currentRound.questionId);
        if (data.answer === question.answer) {
          const winner = state.players.find((p) => p.id === data.playerId);
          if (!winner) return;

          const nextScore = winner.score + state.settings.points[state.settings.difficulty];
          updatePlayerScore(data.playerId, nextScore);
          closeRound({ winnerPlayerId: data.playerId });

          broadcast(KIDS_TRIVIA_EVENTS.SCORE_UPDATED, { playerId: data.playerId, score: nextScore }).catch(() => {});
          broadcast(KIDS_TRIVIA_EVENTS.WINNER_SET, { winnerPlayerId: data.playerId, closedAt: Date.now() }).catch(() => {});

          if (!state.settings.hostRevealOnly) {
            revealAnswer(data.playerId);
            broadcast(KIDS_TRIVIA_EVENTS.ANSWER_REVEALED, { winnerPlayerId: data.playerId, revealedAt: Date.now() }).catch(() => {});
          }
        }
      }
    });

    channel.bind(KIDS_TRIVIA_EVENTS.WINNER_SET, (data: { winnerPlayerId: string | null; closedAt?: number }) => {
      closeRound({ winnerPlayerId: data?.winnerPlayerId ?? null, closedAt: data?.closedAt });
    });

    channel.bind(KIDS_TRIVIA_EVENTS.SCORE_UPDATED, (data: { playerId: string; score: number }) => {
      if (!data?.playerId) return;
      updatePlayerScore(data.playerId, data.score);
    });

    channel.bind(KIDS_TRIVIA_EVENTS.ANSWER_REVEALED, (data: { winnerPlayerId: string | null; revealedAt?: number }) => {
      revealAnswer(data?.winnerPlayerId ?? null, data?.revealedAt);
    });

    channel.bind(KIDS_TRIVIA_EVENTS.GAME_ENDED, (data: { reason?: string; hostName?: string }) => {
      setGameEnded(true);
      setEndHostName(data?.hostName);
      setEndReason((data?.reason as any) || 'completed');
      setStatus('finished');
    });

    channel.bind(KIDS_TRIVIA_EVENTS.HOST_HEARTBEAT, () => {
      lastHostHeartbeatRef.current = Date.now();
      if (hostDisconnected) setHostDisconnected(false);
    });

    channel.bind(KIDS_TRIVIA_EVENTS.HOST_TRANSFERRED, (data: { newHostId: string; newHostName?: string }) => {
      if (!data?.newHostId) return;
      setHostId(data.newHostId);
      applySyncedState({
        hostId: data.newHostId,
        players: useKidsTriviaStore.getState().players.map((p) => ({ ...p, isHost: p.id === data.newHostId })),
      });
      setHostDisconnected(false);

      const amIHost = data.newHostId === playerId;
      setIsHost(amIHost);
      sessionStorage.setItem('isHost', amIHost ? 'true' : 'false');
    });

    channel.bind(KIDS_TRIVIA_EVENTS.REQUEST_STATE_SYNC, (data: { requesterId: string }) => {
      if (!isHost) return;
      if (!data?.requesterId || data.requesterId === playerId) return;
      const state = useKidsTriviaStore.getState();
      broadcast(KIDS_TRIVIA_EVENTS.STATE_SYNC, {
        targetId: data.requesterId,
        state: {
          hostId: state.hostId,
          status: state.status,
          players: state.players,
          settings: state.settings,
          round: state.round,
          usedQuestionIds: state.usedQuestionIds,
        },
      }).catch(() => {});
    });

    channel.bind(KIDS_TRIVIA_EVENTS.STATE_SYNC, (data: { targetId: string; state: any }) => {
      if (data?.targetId !== playerId) return;
      applySyncedState(data.state);
    });

    if (!isHost) {
      setTimeout(() => {
        broadcast(KIDS_TRIVIA_EVENTS.REQUEST_STATE_SYNC, { requesterId: playerId }).catch(() => {});
      }, 500);
    }

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [
    addPlayer,
    addUsedQuestionId,
    applySyncedState,
    broadcast,
    hostDisconnected,
    isHost,
    playerId,
    realtimeConfigured,
    removePlayer,
    revealAnswer,
    roomCode,
    setHostId,
    setSettings,
    setStatus,
    startRound,
    submitAnswer,
    updatePlayerScore,
  ]);

  useEffect(() => {
    return () => {
      if (!playerId) return;
      if (joinedAsPlayerRef.current) {
        broadcast(KIDS_TRIVIA_EVENTS.PLAYER_LEFT, { playerId }).catch(() => {});
      }
      fetch(`/api/rooms/${roomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave', playerId }),
      }).catch(() => {});
    };
  }, [broadcast, playerId, roomCode]);

  // Host heartbeat + disconnect detection
  useEffect(() => {
    if (!connected) return;

    if (isHost) {
      if (hostHeartbeatIntervalRef.current) clearInterval(hostHeartbeatIntervalRef.current);
      hostHeartbeatIntervalRef.current = setInterval(() => {
        broadcast(KIDS_TRIVIA_EVENTS.HOST_HEARTBEAT, {}).catch(() => {});
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
  }, [broadcast, connected, isHost]);

  const handleTakeOverHost = async () => {
    if (isSpectator) return;
    setIsHost(true);
    sessionStorage.setItem('isHost', 'true');
    setHostId(playerId);
    applySyncedState({
      hostId: playerId,
      players: useKidsTriviaStore.getState().players.map((p) => ({ ...p, isHost: p.id === playerId })),
    });
    setHostDisconnected(false);
    await broadcast(KIDS_TRIVIA_EVENTS.HOST_TRANSFERRED, { newHostId: playerId, newHostName: playerName });
  };

  useEffect(() => {
    if (!round) return;
    if (status !== 'playing') return;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - round.startedAt) / 1000;
      const left = Math.max(0, Math.ceil(settings.timerSeconds - elapsed));

      if (left <= 3 && left > 0) {
        if (lastCountdownSecondRef.current !== left) {
          playKidsTriviaSfx('countdown');
          lastCountdownSecondRef.current = left;
        }
      }

      if (left === 0 && isHost) {
        const state = useKidsTriviaStore.getState();
        if (state.status === 'playing' && state.round && !state.round.closedAt) {
          playKidsTriviaSfx('timeup');
          closeRound({ winnerPlayerId: null });
          broadcast(KIDS_TRIVIA_EVENTS.WINNER_SET, { winnerPlayerId: null, closedAt: Date.now() }).catch(() => {});
          if (!state.settings.hostRevealOnly) {
            revealAnswer(null);
            broadcast(KIDS_TRIVIA_EVENTS.ANSWER_REVEALED, { winnerPlayerId: null, revealedAt: Date.now() }).catch(() => {});
          }
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [broadcast, closeRound, isHost, revealAnswer, round, settings.timerSeconds, status]);

  useEffect(() => {
    if (!round || status !== 'reveal') return;
    if (round.revealedAt && lastRevealAtRef.current === round.revealedAt) return;
    lastRevealAtRef.current = round.revealedAt ?? Date.now();

    unlockKidsTriviaAudio();
    playKidsTriviaSfx('reveal');

    const question = getQuestionById(round.questionId);
    const mine = round.answersByPlayerId[playerId];
    if (!mine) return;
    if (mine === question.answer) playKidsTriviaSfx('correct');
    else playKidsTriviaSfx('wrong');
  }, [playerId, round, status]);

  const handleStartGame = async () => {
    unlockKidsTriviaAudio();
    playKidsTriviaSfx('tap');
    setStatus('playing');

    try {
      await fetch(`/api/rooms/${roomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', status: 'playing' }),
      });
    } catch {
      // ignore
    }

    await broadcast(KIDS_TRIVIA_EVENTS.SETTINGS_UPDATED, settings);
    await handleNextQuestion(true);
  };

  const handleNextQuestion = async (isFirst = false) => {
    unlockKidsTriviaAudio();
    playKidsTriviaSfx('tap');

    const currentIndex = round?.index ?? 0;
    const nextIndex = isFirst ? 1 : currentIndex + 1;
    if (!isFirst && nextIndex > settings.maxRounds) {
      setStatus('finished');
      setGameEnded(true);
      setEndReason('completed');
      await broadcast(KIDS_TRIVIA_EVENTS.GAME_ENDED, { reason: 'completed' });
      return;
    }

    const questionId = pickNextQuestionId({ difficulty: settings.difficulty, usedQuestionIds });
    addUsedQuestionId(questionId);
    const nextRound = createRound({ index: nextIndex, questionId });
    startRound(nextRound);

    await broadcast(KIDS_TRIVIA_EVENTS.QUESTION_SET, {
      round: nextRound,
      usedQuestionIds: [...usedQuestionIds, questionId].slice(-50),
    });
  };

  const handleReveal = async () => {
    unlockKidsTriviaAudio();
    playKidsTriviaSfx('reveal');
    revealAnswer(round?.winnerPlayerId ?? null);
    await broadcast(KIDS_TRIVIA_EVENTS.ANSWER_REVEALED, { winnerPlayerId: round?.winnerPlayerId ?? null, revealedAt: Date.now() });
  };

  const handleEndGame = async () => {
    setShowEndConfirm(false);
    const hostName = sessionStorage.getItem('playerName') || undefined;
    setGameEnded(true);
    setEndReason('host-ended');
    setEndHostName(hostName);
    setStatus('finished');

    await broadcast(KIDS_TRIVIA_EVENTS.GAME_ENDED, { reason: 'host-ended', hostName });
    fetch(`/api/rooms/${roomCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-status', status: 'finished' }),
    }).catch(() => {});
  };

  const handleSubmit = async (answer: string) => {
    unlockKidsTriviaAudio();
    playKidsTriviaSfx('tap');
    if (!round || status !== 'playing') return;
    if (isSpectator) return;
    if (round.closedAt) return;
    if (myAnswer) return;
    submitAnswer(playerId, answer);
    await broadcast(KIDS_TRIVIA_EVENTS.ANSWER_SUBMITTED, {
      playerId,
      playerName,
      answer,
      time: Date.now(),
    } satisfies AnswerSubmittedPayload);
  };

  const handleSettings = async (
    next: Partial<{
      difficulty: KidsTriviaDifficulty;
      timerSeconds: number;
      maxRounds: number;
      hintDelaySeconds: number;
      autoShowHint: boolean;
      hostRevealOnly: boolean;
    }>,
  ) => {
    const nextSettings = {
      ...settings,
      ...next,
      timerSeconds: Math.max(5, Math.min(30, next.timerSeconds ?? settings.timerSeconds)),
      maxRounds: Math.max(3, Math.min(30, next.maxRounds ?? settings.maxRounds)),
      hintDelaySeconds: Math.max(0, Math.min(15, next.hintDelaySeconds ?? settings.hintDelaySeconds)),
    };
    setSettings(nextSettings);
    await broadcast(KIDS_TRIVIA_EVENTS.SETTINGS_UPDATED, nextSettings);
  };

  const leaderboard = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const winner = round?.winnerPlayerId ? players.find((p) => p.id === round.winnerPlayerId) : null;

  return (
    <ErrorBoundary>
      <div className="min-h-screen text-white bg-gradient-to-b from-emerald-950 via-green-900 to-blue-950" onPointerDown={() => unlockKidsTriviaAudio()}>
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link href="/kids-trivia" className="inline-flex items-center gap-2 text-emerald-200 hover:text-yellow-300">
                <span className="text-lg">←</span> Kids Trivia home
              </Link>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-2">Kids Bible Trivia</h1>
              <p className="text-emerald-200/80 mt-1">
                Room <span className="font-black tracking-widest text-yellow-300">{roomCode.toUpperCase()}</span>
              </p>
              {isSpectator ? (
                <p className="text-emerald-100/80 text-sm mt-1">
                  You are a spectator: <span className="font-semibold text-white">{playerName}</span>
                </p>
              ) : me ? (
                <p className="text-emerald-100/80 text-sm mt-1">
                  You are {me.isHost ? 'the host' : 'a player'}: <span className="font-semibold text-white">{me.name}</span>
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              {isSpectator && (
                <span className="px-3 py-2 rounded-lg bg-black/20 text-white text-sm font-semibold">
                  Spectator
                </span>
              )}
              <button
                onClick={() => {
                  setKidsTriviaSfxEnabled(!sfxEnabled);
                  setSfxEnabled(!sfxEnabled);
                }}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-yellow-300/50 text-sm font-semibold transition-colors"
              >
                {sfxEnabled ? 'Sound: On' : 'Sound: Off'}
              </button>

              {realtimeConfigured && (
                <span
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    connected ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100' : 'bg-yellow-500/10 border-yellow-300/30 text-yellow-200'
                  }`}
                >
                  {connected ? 'Connected' : 'Connecting…'}
                </span>
              )}

              {isHost && status !== 'lobby' && (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold"
                >
                  End Game
                </button>
              )}
            </div>
          </header>

          {!realtimeConfigured && (
            <div className="rounded-2xl border border-yellow-300/30 bg-yellow-500/10 p-4 text-yellow-100">
              <p className="font-semibold">Realtime is disabled for this build.</p>
              <p className="text-sm text-yellow-100/80">
                Add Pusher env vars to enable online rooms.
              </p>
            </div>
          )}

          {hostDisconnected && !isHost && (
            <div className="rounded-2xl border border-yellow-300/30 bg-yellow-500/10 p-4 text-yellow-100 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Host disconnected</p>
                <p className="text-sm text-yellow-100/80">Waiting for host… or take over to keep playing.</p>
              </div>
              {!isSpectator && (
                <button
                  onClick={handleTakeOverHost}
                  className="px-3 py-2 rounded-lg bg-yellow-300 text-blue-950 font-black hover:bg-yellow-200"
                >
                  Become Host
                </button>
              )}
            </div>
          )}

          <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
              {status === 'lobby' ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black">Lobby</h2>
                      <p className="text-emerald-100/80 text-sm">
                        Invite players, pick a difficulty, and start when everyone is ready.
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <InvitePanel roomCode={roomCode.toUpperCase()} gameType="kids-trivia" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <label className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">Difficulty</div>
                      <select
                        value={settings.difficulty}
                        onChange={(e) => handleSettings({ difficulty: e.target.value as KidsTriviaDifficulty })}
                        disabled={!isHost}
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-300/60 disabled:opacity-60"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </label>

                    <label className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">Timer (sec)</div>
                      <input
                        type="number"
                        value={settings.timerSeconds}
                        min={5}
                        max={30}
                        onChange={(e) => handleSettings({ timerSeconds: Number(e.target.value) })}
                        disabled={!isHost}
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-300/60 disabled:opacity-60"
                      />
                    </label>

                    <label className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">Hint unlock (sec)</div>
                      <input
                        type="number"
                        value={settings.hintDelaySeconds}
                        min={0}
                        max={15}
                        onChange={(e) => handleSettings({ hintDelaySeconds: Number(e.target.value) })}
                        disabled={!isHost}
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-300/60 disabled:opacity-60"
                      />
                    </label>

                    <label className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                      <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">Rounds</div>
                      <input
                        type="number"
                        value={settings.maxRounds}
                        min={3}
                        max={30}
                        onChange={(e) => handleSettings({ maxRounds: Number(e.target.value) })}
                        disabled={!isHost}
                        className="w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-300/60 disabled:opacity-60"
                      />
                    </label>
                  </div>

                  <div className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">Auto-show hint</div>
                      <div className="text-sm text-emerald-100/80">
                        When the hint unlocks, show it automatically for everyone.
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettings({ autoShowHint: !settings.autoShowHint })}
                      disabled={!isHost}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-60 ${
                        settings.autoShowHint
                          ? 'bg-yellow-300 text-blue-950 border-yellow-200'
                          : 'bg-white/5 border-white/10 hover:border-yellow-300/50'
                      }`}
                    >
                      {settings.autoShowHint ? 'On' : 'Off'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="min-w-0">
                      <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">Host reveals answers</div>
                      <div className="text-sm text-emerald-100/80">
                        If enabled, the host must press Reveal before everyone sees the correct answer.
                      </div>
                    </div>
                    <button
                      onClick={() => handleSettings({ hostRevealOnly: !settings.hostRevealOnly })}
                      disabled={!isHost}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors disabled:opacity-60 ${
                        settings.hostRevealOnly
                          ? 'bg-yellow-300 text-blue-950 border-yellow-200'
                          : 'bg-white/5 border-white/10 hover:border-yellow-300/50'
                      }`}
                    >
                      {settings.hostRevealOnly ? 'On' : 'Off'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-emerald-100/80 text-sm">
                      <div className="font-semibold text-white mb-1">Players</div>
                      <div>{players.length} joined</div>
                    </div>
                    {isHost ? (
                      <button
                        onClick={handleStartGame}
                        disabled={!realtimeConfigured}
                        className="px-5 py-3 rounded-xl bg-yellow-300 text-blue-950 font-black hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Start game →
                      </button>
                    ) : (
                      <div className="text-sm text-emerald-100/70">
                        Waiting for the host to start…
                      </div>
                    )}
                  </div>
                </div>
              ) : !round || !activeQuestion ? (
                <LoadingSpinner message="Loading round..." />
              ) : (
                <div className="space-y-5">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-green-800 to-blue-900 border border-emerald-600/40 p-5">
                    <KidsTriviaScene questionId={activeQuestion.id} difficulty={settings.difficulty} className="absolute inset-0" />
                    <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">
                        Round {round.index} / {settings.maxRounds}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-black leading-snug mt-1">
                        {activeQuestion.prompt}
                      </h2>
                      <p className="text-emerald-100/80 text-sm mt-1">
                        Scripture: {activeQuestion.scripture}
                      </p>
                    </div>

                    <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-3xl">
                      <span className="drop-shadow-sm">{activeQuestion.emoji}</span>
                    </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-emerald-100/80 font-semibold">Timer</span>
                      <span className="font-black tabular-nums text-yellow-200">
                        {status === 'playing' ? `${remainingSeconds ?? settings.timerSeconds}s` : '—'}
                      </span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-300 via-emerald-300 to-cyan-300 transition-[width] duration-200"
                        style={{
                          width:
                            status === 'playing' && remainingSeconds !== null
                              ? `${Math.max(0, Math.min(100, (remainingSeconds / settings.timerSeconds) * 100))}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {activeQuestion.options.map((option) => {
                      const isChosen = myAnswer === option;
                      const isAnswer = option === activeQuestion.answer;
                      const showResults = status === 'reveal';
                      const classes = showResults
                        ? isAnswer
                          ? 'border-green-400 bg-green-500/20'
                          : isChosen
                            ? 'border-red-400 bg-red-500/15'
                            : 'border-white/10'
                        : myAnswer
                          ? 'border-white/10 opacity-80 cursor-not-allowed'
                          : 'border-white/10 hover:border-yellow-300/50';

                      return (
                        <button
                          key={option}
                          onClick={() => handleSubmit(option)}
                          disabled={isSpectator || !!myAnswer || status !== 'playing' || roundClosed}
                          className={`text-left p-4 rounded-xl border transition-all ${classes}`}
                        >
                          <span className="font-semibold">{option}</span>
                          {showResults && isAnswer && (
                            <p className="text-green-100 text-sm mt-1">Correct answer</p>
                          )}
                          {showResults && isChosen && !isAnswer && (
                            <p className="text-red-100 text-sm mt-1">Nice try!</p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-emerald-100/80 text-sm">
                      Hint:{' '}
                      {!hintUnlocked ? (
                        <span className="text-emerald-100/70">unlocks in {hintUnlockInSeconds}s</span>
                      ) : settings.autoShowHint || showHint ? (
                        <span className="text-white font-semibold">{activeQuestion.hint}</span>
                      ) : (
                        <span className="text-emerald-100/70">ready</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!settings.autoShowHint && (
                        <button
                          onClick={() => setShowHint((prev) => !prev)}
                          disabled={!hintUnlocked}
                          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-yellow-300/50 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {hintUnlocked ? (showHint ? 'Hide hint' : 'Show hint') : `Hint in ${hintUnlockInSeconds}s`}
                        </button>
                      )}
                      {isHost && (
                        <>
                          <button
                            onClick={handleReveal}
                            disabled={!roundClosed || status === 'reveal'}
                            className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-yellow-300/50 text-sm font-semibold transition-colors"
                          >
                            Reveal
                          </button>
                          <button
                            onClick={() => handleNextQuestion(false)}
                            className="px-4 py-2 rounded-lg bg-yellow-300 text-blue-950 font-black hover:bg-yellow-200 transition-colors"
                          >
                            Next →
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {settings.hostRevealOnly && roundClosed && status === 'playing' && (
                    <div className="p-4 rounded-xl border border-yellow-300/30 bg-yellow-500/10 text-yellow-100">
                      <div className="font-semibold">Round locked in.</div>
                      <div className="text-sm text-yellow-100/80">Waiting for the host to reveal the answer.</div>
                    </div>
                  )}

                  {status === 'reveal' && (
                    <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-xl">{winner ? '🏆' : '⏰'}</span>
                        <span>
                          {winner
                            ? `Winner: ${winner.name} (+${settings.points[settings.difficulty]} pts)`
                            : 'Time is up! No winner this round.'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-lg font-bold mb-3">Scoreboard</h3>
                <div className="space-y-2">
                  {leaderboard.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-white/10">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">
                          {p.name} {p.isHost ? <span className="text-yellow-200/90 text-xs">(host)</span> : null}
                        </div>
                        {round && round.answersByPlayerId[p.id] && (
                          <div className="text-xs text-emerald-100/70">
                            Answered: <span className="text-white/90">{round.answersByPlayerId[p.id]}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-xl font-black tabular-nums">{p.score}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-800 to-green-700 rounded-2xl p-5 border border-emerald-500/40 shadow-lg">
                <h3 className="text-lg font-bold mb-2">Quick rules</h3>
                <ul className="space-y-1 text-emerald-50/90 text-sm">
                  <li>• Tap the answer you think matches the clue.</li>
                  <li>• First correct answer wins the points for the round.</li>
                  <li>• The host can reveal early or move to the next question.</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-emerald-950 rounded-2xl p-6 max-w-md w-full border border-white/10">
            <h2 className="text-2xl font-bold text-yellow-300 mb-2 text-center">End game?</h2>
            <p className="text-emerald-100/80 text-sm text-center mb-6">
              This will stop the current game for everyone in the room.
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
                className="flex-1 py-3 bg-yellow-300 hover:bg-yellow-200 text-blue-950 font-black rounded-lg"
              >
                End Game
              </button>
            </div>
          </div>
        </div>
      )}

      {gameEnded && (
        <GameEndedOverlay
          title="Kids Trivia Ended"
          reason={endReason}
          hostName={endHostName}
          primaryAction={{ label: 'Back to Lobby', href: '/kids-trivia' }}
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
    </ErrorBoundary>
  );
}
