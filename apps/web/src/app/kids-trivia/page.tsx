'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { kidsTriviaQuestions, type KidsTriviaQuestion } from '@games/kids-trivia/questions';
import { isValidRoomCode, sanitizePlayerName } from '@shared/lib/validation';
import type { PublicRoom } from '@shared/types';
import { isRealtimeClientConfigured } from '@shared/lib/env';
import {
  isKidsTriviaSfxEnabled,
  playKidsTriviaSfx,
  setKidsTriviaSfxEnabled,
  unlockKidsTriviaAudio,
} from './lib/sfx';
import { KidsTriviaScene } from './lib/scenes';

type Difficulty = 'easy' | 'medium' | 'hard';
type Tab = 'practice' | 'online';

type PracticePlayer = {
  id: string;
  name: string;
  score: number;
};

const pointsByDifficulty: Record<Difficulty, number> = {
  easy: 10,
  medium: 15,
  hard: 20,
};

const difficultyInfo: Record<Difficulty, { label: string; detail: string }> = {
  easy: { label: 'Easy', detail: 'Gentle starters for younger kiddos' },
  medium: { label: 'Medium', detail: 'A little more detail to notice' },
  hard: { label: 'Challenging', detail: 'Memory + courage questions' },
};

const defaultPlayers: PracticePlayer[] = [
  { id: 'team-a', name: 'Team A', score: 0 },
  { id: 'team-b', name: 'Team B', score: 0 },
];

function getQuestion(difficulty: Difficulty, excludeIds: Set<string>): KidsTriviaQuestion {
  const filtered = kidsTriviaQuestions.filter((q) => q.difficulty === difficulty);
  const available = filtered.filter((q) => !excludeIds.has(q.id));
  const pool = available.length > 0 ? available : filtered;
  return pool[Math.floor(Math.random() * pool.length)] ?? kidsTriviaQuestions[0]!;
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export default function KidsTriviaHomePage() {
  const router = useRouter();
  const realtimeConfigured = isRealtimeClientConfigured();

  const [tab, setTab] = useState<Tab>('practice');
  const [sfxEnabled, setSfxEnabled] = useState(isKidsTriviaSfxEnabled());

  // Practice mode state
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [currentQuestion, setCurrentQuestion] = useState<KidsTriviaQuestion>(() => getQuestion('easy', new Set()));
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [players, setPlayers] = useState<PracticePlayer[]>(defaultPlayers);
  const [activePlayerId, setActivePlayerId] = useState<string>(defaultPlayers[0].id);
  const [newPlayerName, setNewPlayerName] = useState('');

  const [timerSeconds, setTimerSeconds] = useState(12);
  const [hintDelaySeconds, setHintDelaySeconds] = useState(5);
  const [autoShowHint, setAutoShowHint] = useState(true);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [remaining, setRemaining] = useState(timerSeconds);
  const lastCountdownSecondRef = useRef<number | null>(null);

  // Online mode state
  const [onlineMode, setOnlineMode] = useState<'menu' | 'create' | 'browse' | 'join'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [joinCode, setJoinCode] = useState('');
  const [onlineError, setOnlineError] = useState('');
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [publicRooms, setPublicRooms] = useState<PublicRoom[]>([]);

  const scoreLeaderboard = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const isCorrect = selectedOption !== null && selectedOption === currentQuestion.answer;

  const resetRound = (nextQuestion?: KidsTriviaQuestion) => {
    setSelectedOption(null);
    setReveal(false);
    setShowHint(false);
    setStartedAt(Date.now());
    setRemaining(timerSeconds);
    lastCountdownSecondRef.current = null;
    if (nextQuestion) setCurrentQuestion(nextQuestion);
  };

  const elapsedSeconds = useMemo(() => Math.max(0, timerSeconds - remaining), [remaining, timerSeconds]);
  const hintUnlocked = elapsedSeconds >= hintDelaySeconds;
  const hintUnlockInSeconds = Math.max(0, Math.ceil(hintDelaySeconds - elapsedSeconds));

  useEffect(() => {
    if (!autoShowHint) return;
    if (!hintUnlocked) return;
    if (reveal) return;
    setShowHint(true);
  }, [autoShowHint, hintUnlocked, reveal]);

  useEffect(() => {
    if (tab !== 'practice') return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const nextRemaining = Math.max(0, Math.ceil(timerSeconds - elapsed));
      setRemaining(nextRemaining);

      if (!reveal && selectedOption === null) {
        if (nextRemaining <= 3 && nextRemaining > 0) {
          if (lastCountdownSecondRef.current !== nextRemaining) {
            playKidsTriviaSfx('countdown');
            lastCountdownSecondRef.current = nextRemaining;
          }
        }
        if (nextRemaining === 0) {
          playKidsTriviaSfx('timeup');
          setReveal(true);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [reveal, selectedOption, startedAt, tab, timerSeconds]);

  const handleAnswerPractice = (option: string) => {
    unlockKidsTriviaAudio();
    if (reveal || selectedOption) return;
    setSelectedOption(option);
    setReveal(true);

    if (option === currentQuestion.answer) {
      playKidsTriviaSfx('correct');
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === activePlayerId ? { ...p, score: p.score + pointsByDifficulty[difficulty] } : p,
        ),
      );
    } else {
      playKidsTriviaSfx('wrong');
    }
  };

  const handleNextQuestionPractice = () => {
    unlockKidsTriviaAudio();
    playKidsTriviaSfx('tap');

    setUsedIds((prev) => {
      const next = new Set(prev);
      next.add(currentQuestion.id);
      return next;
    });
    const next = getQuestion(difficulty, new Set([...usedIds, currentQuestion.id]));
    resetRound(next);
  };

  const handleDifficultyChange = (value: Difficulty) => {
    unlockKidsTriviaAudio();
    playKidsTriviaSfx('tap');
    setDifficulty(value);
    setUsedIds(new Set());
    resetRound(getQuestion(value, new Set()));
  };

  const handleAddPlayer = () => {
    unlockKidsTriviaAudio();
    playKidsTriviaSfx('tap');
    if (!newPlayerName.trim() || players.length >= 5) return;
    const id = `player-${Date.now()}`;
    setPlayers((prev) => [...prev, { id, name: newPlayerName.trim(), score: 0 }]);
    setActivePlayerId((prevId) => prevId ?? id);
    setNewPlayerName('');
  };

  const handleResetScores = () => {
    unlockKidsTriviaAudio();
    playKidsTriviaSfx('tap');
    setPlayers((prev) => prev.map((p) => ({ ...p, score: 0 })));
    setUsedIds(new Set());
    resetRound(getQuestion(difficulty, new Set()));
  };

  const fetchPublicRooms = async () => {
    setOnlineLoading(true);
    try {
      const res = await fetch('/api/rooms?gameType=kids-trivia');
      const data = await res.json();
      setPublicRooms(data.rooms || []);
    } catch {
      // ignore
    }
    setOnlineLoading(false);
  };

  const handleCreateOnlineRoom = async () => {
    const sanitizedName = sanitizePlayerName(playerName);
    if (!sanitizedName) {
      setOnlineError('Please enter your name');
      return;
    }
    if (!realtimeConfigured) {
      setOnlineError('Realtime is disabled for this build. Set Pusher env vars to create online rooms.');
      return;
    }

    setOnlineLoading(true);
    setOnlineError('');

    try {
      const createdPlayerId = uuidv4();

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: sanitizedName,
          playerId: createdPlayerId,
          roomName: roomName.trim() || undefined,
          isPrivate,
          maxPlayers,
          gameType: 'kids-trivia',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create room');
      }

      const { room } = await response.json();
      sessionStorage.setItem('playerId', createdPlayerId);
      sessionStorage.setItem('playerName', sanitizedName);
      sessionStorage.setItem('isHost', 'true');
      sessionStorage.setItem('isSpectator', 'false');

      router.push(`/kids-trivia/game/${room.code}`);
    } catch (err) {
      setOnlineError(err instanceof Error ? err.message : 'Failed to create room');
      setOnlineLoading(false);
    }
  };

  const handleJoinOnlineRoom = () => {
    const upperCode = joinCode.toUpperCase();
    if (!isValidRoomCode(upperCode)) {
      setOnlineError('Please enter a valid 6-character room code');
      return;
    }
    router.push(`/kids-trivia/join/${upperCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-green-900 to-blue-950 text-white" onPointerDown={() => unlockKidsTriviaAudio()}>
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-emerald-200 hover:text-yellow-300 transition-colors">
              <span className="text-lg">←</span> Back to games
            </Link>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mt-2">Kids Bible Trivia</h1>
            <p className="text-emerald-200/80 mt-1">
              Picture-style clues, multiple choice answers, quick rounds, and cozy sound effects.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setKidsTriviaSfxEnabled(!sfxEnabled);
                setSfxEnabled(!sfxEnabled);
              }}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-yellow-300/50 text-sm font-semibold transition-colors"
            >
              {sfxEnabled ? 'Sound: On' : 'Sound: Off'}
            </button>
            <span className="px-3 py-2 rounded-lg bg-yellow-300 text-blue-950 text-sm font-black">
              Beta
            </span>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTab('practice')}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              tab === 'practice'
                ? 'bg-yellow-300 text-blue-950 border-yellow-200'
                : 'bg-white/5 border-white/10 hover:border-yellow-300/50'
            }`}
          >
            Offline practice
          </button>
          <button
            onClick={() => {
              setTab('online');
              setOnlineMode('menu');
              setOnlineError('');
            }}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
              tab === 'online'
                ? 'bg-yellow-300 text-blue-950 border-yellow-200'
                : 'bg-white/5 border-white/10 hover:border-yellow-300/50'
            }`}
          >
            Online multiplayer
          </button>
        </div>

        {tab === 'online' && !realtimeConfigured && (
          <div className="rounded-2xl border border-yellow-300/30 bg-yellow-500/10 p-4 text-yellow-100">
            <p className="font-semibold">Realtime is disabled for this build.</p>
            <p className="text-sm text-yellow-100/80">
              Add `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER`, `PUSHER_APP_ID`, and `PUSHER_SECRET` to enable online rooms.
            </p>
          </div>
        )}

        {tab === 'practice' ? (
          <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
            <section className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-400/40 text-sm font-semibold text-green-100">
                    {difficultyInfo[difficulty].label}
                  </div>
                  <p className="text-emerald-100/80 text-sm">{difficultyInfo[difficulty].detail}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => handleDifficultyChange(level)}
                      className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
                        level === difficulty
                          ? 'bg-yellow-300 text-blue-950'
                          : 'bg-white/5 border border-white/10 hover:border-yellow-300/50'
                      }`}
                    >
                      {difficultyInfo[level].label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-green-800 to-blue-900 border border-emerald-600/40 p-5">
                <KidsTriviaScene questionId={currentQuestion.id} difficulty={difficulty} className="absolute inset-0" />
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-4xl">
                      <span className="drop-shadow-sm">{currentQuestion.emoji}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm uppercase tracking-wide text-emerald-100/80 font-semibold">Character clue</p>
                    <h2 className="text-2xl sm:text-3xl font-black leading-snug">{currentQuestion.prompt}</h2>
                    <p className="text-emerald-100/80 text-sm">Scripture: {currentQuestion.scripture}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-100/80 font-semibold">Timer</span>
                  <span className="font-black tabular-nums text-yellow-200">{reveal ? '—' : `${remaining}s`}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-300 via-emerald-300 to-cyan-300 transition-[width] duration-200"
                    style={{ width: reveal ? '0%' : `${Math.max(0, Math.min(100, (remaining / timerSeconds) * 100))}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-emerald-100/70 uppercase tracking-wide font-semibold">Seconds:</span>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    value={timerSeconds}
                    onChange={(e) => {
                      const next = clampInt(Number(e.target.value), 5, 30);
                      setTimerSeconds(next);
                      setStartedAt(Date.now());
                      setRemaining(next);
                      lastCountdownSecondRef.current = null;
                    }}
                    className="flex-1 accent-yellow-300"
                  />
                  <span className="text-xs tabular-nums w-10 text-right">{timerSeconds}</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-emerald-100/70 uppercase tracking-wide font-semibold">Hint unlock:</span>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={hintDelaySeconds}
                    onChange={(e) => setHintDelaySeconds(clampInt(Number(e.target.value), 0, 15))}
                    className="flex-1 accent-yellow-300"
                  />
                  <span className="text-xs tabular-nums w-10 text-right">{hintDelaySeconds}s</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">
                    Auto-show hint
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoShowHint((prev) => !prev)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      autoShowHint
                        ? 'bg-yellow-300 text-blue-950 border-yellow-200'
                        : 'bg-white/5 border-white/10 hover:border-yellow-300/50'
                    }`}
                  >
                    {autoShowHint ? 'On' : 'Off'}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {currentQuestion.options.map((option) => {
                  const isChosen = selectedOption === option;
                  const isAnswer = option === currentQuestion.answer;
                  const classes = reveal
                    ? isAnswer
                      ? 'border-green-400 bg-green-500/20'
                      : isChosen
                        ? 'border-red-400 bg-red-500/15'
                        : 'border-white/10'
                    : selectedOption
                      ? 'border-white/10 opacity-80 cursor-not-allowed'
                      : 'border-white/10 hover:border-yellow-300/50';
                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerPractice(option)}
                      disabled={!!selectedOption || reveal}
                      className={`text-left p-4 rounded-xl border transition-all ${classes}`}
                    >
                      <span className="font-semibold">{option}</span>
                      {reveal && isAnswer && <p className="text-green-100 text-sm mt-1">That’s the one!</p>}
                      {reveal && isChosen && !isAnswer && <p className="text-red-100 text-sm mt-1">Nice try!</p>}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      unlockKidsTriviaAudio();
                      playKidsTriviaSfx('tap');
                      setShowHint((prev) => !prev);
                    }}
                    disabled={!hintUnlocked}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-yellow-300/50 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {hintUnlocked ? (showHint ? 'Hide hint' : 'Show hint') : `Hint in ${hintUnlockInSeconds}s`}
                  </button>
                  {showHint && (
                    <span className="text-emerald-100/90 text-sm bg-emerald-700/30 border border-emerald-500/40 px-3 py-1 rounded-lg">
                      {currentQuestion.hint}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleNextQuestionPractice}
                  className="px-4 py-2 rounded-lg bg-yellow-300 text-blue-950 font-black hover:bg-yellow-200 transition-colors"
                >
                  Next question →
                </button>
              </div>

              {reveal && (
                <div
                  className={`mt-4 p-4 rounded-xl border ${
                    selectedOption === null
                      ? 'border-yellow-300/40 bg-yellow-500/10'
                      : isCorrect
                        ? 'border-green-400/60 bg-green-500/10'
                        : 'border-red-400/50 bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-xl">
                      {selectedOption === null ? '⏰' : isCorrect ? '✅' : '💡'}
                    </span>
                    <span>
                      {selectedOption === null
                        ? `Time’s up! Answer: ${currentQuestion.answer}`
                        : isCorrect
                          ? `Great job! ${pointsByDifficulty[difficulty]} points to your team.`
                          : `Answer: ${currentQuestion.answer}`}
                    </span>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">Scoreboard</h3>
                  <button
                    onClick={handleResetScores}
                    className="text-xs px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    Reset
                  </button>
                </div>
                <div className="space-y-3">
                  {scoreLeaderboard.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center gap-2 p-3 rounded-xl border ${
                        activePlayerId === player.id ? 'border-yellow-300/70 bg-yellow-300/10' : 'border-white/10'
                      }`}
                    >
                      <input
                        value={player.name}
                        onChange={(e) =>
                          setPlayers((prev) =>
                            prev.map((p) => (p.id === player.id ? { ...p, name: e.target.value } : p)),
                          )
                        }
                        className="flex-1 bg-transparent focus:outline-none border-b border-white/20 pb-1 text-sm"
                      />
                      <span className="text-lg font-black tabular-nums">{player.score}</span>
                      <input
                        type="radio"
                        name="active-player"
                        checked={activePlayerId === player.id}
                        onChange={() => setActivePlayerId(player.id)}
                        className="w-4 h-4 accent-yellow-300"
                      />
                    </div>
                  ))}
                </div>
                {players.length < 5 && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Add player/team"
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 placeholder:text-white/60 text-sm focus:outline-none focus:border-yellow-300/60"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    />
                    <button
                      onClick={handleAddPlayer}
                      className="px-3 py-2 rounded-lg bg-yellow-300 text-blue-950 font-black hover:bg-yellow-200 transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl">
            {onlineMode === 'menu' && (
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    unlockKidsTriviaAudio();
                    playKidsTriviaSfx('tap');
                    setOnlineMode('create');
                    setOnlineError('');
                  }}
                  className="rounded-2xl p-5 border border-white/10 bg-gradient-to-br from-emerald-800 to-green-800 hover:border-yellow-300/50 transition-colors text-left"
                >
                  <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">Host</div>
                  <div className="text-2xl font-black mt-1">Create room</div>
                  <div className="text-sm text-emerald-100/80 mt-2">Start a shared room for family worship or a group night.</div>
                </button>

                <button
                  onClick={() => {
                    unlockKidsTriviaAudio();
                    playKidsTriviaSfx('tap');
                    setOnlineMode('join');
                    setOnlineError('');
                  }}
                  className="rounded-2xl p-5 border border-white/10 bg-gradient-to-br from-blue-800 to-indigo-800 hover:border-yellow-300/50 transition-colors text-left"
                >
                  <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">Player</div>
                  <div className="text-2xl font-black mt-1">Join with code</div>
                  <div className="text-sm text-emerald-100/80 mt-2">Enter a 6-character code from the host.</div>
                </button>

                <button
                  onClick={() => {
                    unlockKidsTriviaAudio();
                    playKidsTriviaSfx('tap');
                    setOnlineMode('browse');
                    setOnlineError('');
                    fetchPublicRooms();
                  }}
                  className="rounded-2xl p-5 border border-white/10 bg-gradient-to-br from-purple-800 to-fuchsia-800 hover:border-yellow-300/50 transition-colors text-left"
                >
                  <div className="text-xs uppercase tracking-wide text-emerald-100/70 font-semibold">Lobby</div>
                  <div className="text-2xl font-black mt-1">Browse rooms</div>
                  <div className="text-sm text-emerald-100/80 mt-2">See public rooms waiting in the lobby.</div>
                </button>
              </div>
            )}

            {onlineMode === 'create' && (
              <div className="max-w-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black">Create Kids Trivia room</h2>
                  <button
                    onClick={() => setOnlineMode('menu')}
                    className="text-sm text-emerald-100/70 hover:text-emerald-100 transition-colors"
                  >
                    Back
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="space-y-2">
                    <span className="text-sm text-emerald-100/80 font-semibold">Your name</span>
                    <input
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-yellow-300/60"
                      placeholder="Host name"
                      maxLength={20}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-emerald-100/80 font-semibold">Room name (optional)</span>
                    <input
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-yellow-300/60"
                      placeholder="e.g., Family Worship"
                      maxLength={50}
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-emerald-100/80 font-semibold">Max players</span>
                    <input
                      type="number"
                      value={maxPlayers}
                      min={2}
                      max={15}
                      onChange={(e) => setMaxPlayers(clampInt(Number(e.target.value), 2, 15))}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-yellow-300/60"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-emerald-100/80 font-semibold">Visibility</span>
                    <button
                      type="button"
                      onClick={() => setIsPrivate((prev) => !prev)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-yellow-300/50 transition-colors text-left"
                    >
                      <span className="font-semibold">{isPrivate ? 'Private' : 'Public'}</span>
                      <span className="block text-xs text-emerald-100/70">
                        {isPrivate ? 'Not listed in the lobby' : 'Visible in Browse rooms'}
                      </span>
                    </button>
                  </label>
                </div>

                {onlineError && <p className="text-red-300 text-sm mt-3">{onlineError}</p>}

                <button
                  onClick={handleCreateOnlineRoom}
                  disabled={onlineLoading}
                  className="mt-4 px-5 py-3 rounded-xl bg-yellow-300 text-blue-950 font-black hover:bg-yellow-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {onlineLoading ? 'Creating…' : 'Create room →'}
                </button>
              </div>
            )}

            {onlineMode === 'join' && (
              <div className="max-w-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black">Join with code</h2>
                  <button
                    onClick={() => setOnlineMode('menu')}
                    className="text-sm text-emerald-100/70 hover:text-emerald-100 transition-colors"
                  >
                    Back
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase());
                      setOnlineError('');
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-yellow-300/60 tracking-widest text-center text-lg uppercase"
                    placeholder="ABC123"
                    maxLength={6}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinOnlineRoom()}
                  />
                  <button
                    onClick={handleJoinOnlineRoom}
                    className="px-5 py-3 rounded-xl bg-yellow-300 text-blue-950 font-black hover:bg-yellow-200"
                  >
                    Join →
                  </button>
                </div>
                {onlineError && <p className="text-red-300 text-sm mt-3">{onlineError}</p>}
                <p className="text-emerald-100/70 text-sm mt-3">
                  You’ll enter your name on the next screen.
                </p>
              </div>
            )}

            {onlineMode === 'browse' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black">Public rooms</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOnlineMode('menu')}
                      className="text-sm text-emerald-100/70 hover:text-emerald-100 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={fetchPublicRooms}
                      disabled={onlineLoading}
                      className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-yellow-300/50 text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      {onlineLoading ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </div>
                </div>

                {publicRooms.length === 0 ? (
                  <div className="text-emerald-100/70 text-sm">No public rooms waiting right now.</div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-3">
                    {publicRooms.map((room) => (
                      <button
                        key={room.code}
                        onClick={() => router.push(`/kids-trivia/join/${room.code}`)}
                        className="text-left rounded-2xl p-4 border border-white/10 bg-white/5 hover:border-yellow-300/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-white">{room.roomName}</div>
                            <div className="text-xs text-emerald-100/70">Hosted by {room.hostName}</div>
                          </div>
                          <div className="text-xs bg-black/20 px-2 py-1 rounded-lg">
                            {room.playerCount}/{room.maxPlayers}
                          </div>
                        </div>
                        {room.description && (
                          <div className="text-sm text-emerald-100/80 mt-2">{room.description}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
