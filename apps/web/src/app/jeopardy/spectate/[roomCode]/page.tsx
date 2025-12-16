'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../lib/gameStore';
import { getPusherClient, getGameChannel, JEOPARDY_EVENTS as GAME_EVENTS } from '@shared/lib/pusher';
import { Player, Question, GameBoard, GameState, GameStatus } from '../../types/game';
import JeopardyBoard from '../../components/JeopardyBoard';
import Scoreboard from '../../components/Scoreboard';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';

export default function SpectatorPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();

  const [isConnected, setIsConnected] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentQuestionDisplay, setCurrentQuestionDisplay] = useState<Question | null>(null);
  const [buzzedPlayerName, setBuzzedPlayerName] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    status,
    players,
    board,
    currentQuestion,
    buzzedPlayer,
    hostId,
    round,
    isTeamMode,
    teams,
    finalJeopardy,
    setRoomCode,
    addPlayer,
    removePlayer,
    updatePlayerScore,
    setStatus,
    setBoard,
    selectQuestion,
    playerBuzz,
    resetBuzz,
    markQuestionAnswered,
    initializeBoard,
    updateGameState,
    setRound,
    fullReset,
  } = useGameStore();

  // Clear any previous game state when entering
  useEffect(() => {
    fullReset();
  }, [roomCode, fullReset]);

  // Set room code
  useEffect(() => {
    setRoomCode(roomCode);
  }, [roomCode, setRoomCode]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Pusher real-time subscription (read-only)
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(getGameChannel(roomCode));

    channel.bind(GAME_EVENTS.PLAYER_JOINED, (data: Player) => {
      addPlayer(data);
    });

    channel.bind(GAME_EVENTS.PLAYER_LEFT, (data: { playerId: string }) => {
      removePlayer(data.playerId);
    });

    channel.bind(GAME_EVENTS.GAME_STARTED, (data: { categoryIds: string[] }) => {
      initializeBoard(data.categoryIds);
    });

    channel.bind(GAME_EVENTS.QUESTION_SELECTED, (data: { question: Question }) => {
      selectQuestion(data.question);
      setCurrentQuestionDisplay(data.question);
      setShowAnswer(false);
      setBuzzedPlayerName(null);
    });

    channel.bind(GAME_EVENTS.PLAYER_BUZZED, (data: { playerId: string; time: number }) => {
      playerBuzz(data.playerId, data.time);
      const player = players.find(p => p.id === data.playerId);
      setBuzzedPlayerName(player?.name || 'Player');
    });

    channel.bind(GAME_EVENTS.ANSWER_JUDGED, (data: { playerId: string; correct: boolean; newScore: number }) => {
      updatePlayerScore(data.playerId, data.newScore);
    });

    channel.bind(GAME_EVENTS.QUESTION_CLOSED, (data: { questionId: string }) => {
      markQuestionAnswered(data.questionId);
      setCurrentQuestionDisplay(null);
      setShowAnswer(false);
      setBuzzedPlayerName(null);
    });

    // Only show answer when host explicitly broadcasts it
    channel.bind(GAME_EVENTS.REVEAL_ANSWER, () => {
      setShowAnswer(true);
    });

    channel.bind(GAME_EVENTS.BUZZ_RESET, () => {
      resetBuzz();
      setBuzzedPlayerName(null);
    });

    channel.bind(GAME_EVENTS.GAME_STATE_UPDATE, (data: Record<string, unknown>) => {
      updateGameState(data as Partial<GameState>);
    });

    // State sync for late joiners
    channel.bind(GAME_EVENTS.STATE_SYNC, (data: {
      status: string;
      board: GameBoard;
      round: number;
      players: Player[];
      isTeamMode: boolean;
      teams: typeof teams;
    }) => {
      if (data.status) setStatus(data.status as GameStatus);
      if (data.board) setBoard(data.board);
      if (data.round === 1 || data.round === 2) setRound(data.round);
      data.players?.forEach((p: Player) => addPlayer(p));
    });

    channel.bind(GAME_EVENTS.GAME_ENDED, () => {
      setStatus('finished');
    });

    setIsConnected(true);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(getGameChannel(roomCode));
    };
  }, [roomCode, players, addPlayer, removePlayer, initializeBoard, selectQuestion, playerBuzz, updatePlayerScore, markQuestionAnswered, resetBuzz, updateGameState, setStatus, setBoard, setRound]);

  // Loading state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <LoadingSpinner message="Connecting to game..." size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 p-4">
        {/* Header - Minimal for TV display */}
        <header className="max-w-7xl mx-auto mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-400 tracking-wide">
                BIBLE JEOPARDY
                {round === 2 && <span className="ml-3 text-2xl lg:text-3xl">- Double Jeopardy!</span>}
              </h1>
              <p className="text-blue-300 text-lg">Room: {roomCode}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                PROJECTOR VIEW
              </span>
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => router.push('/jeopardy')}
                className="p-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
                title="Exit"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto">
          {/* Waiting for game */}
          {(status === 'lobby' || status === 'category-select') && (
            <div className="text-center py-20">
              <div className="bg-blue-900/80 rounded-2xl p-12 max-w-2xl mx-auto border border-blue-700">
                <div className="text-6xl mb-6">
                  {status === 'lobby' ? '👥' : '📋'}
                </div>
                <h2 className="text-4xl font-bold text-yellow-400 mb-4">
                  {status === 'lobby' ? 'Waiting for Players' : 'Selecting Categories'}
                </h2>
                <p className="text-blue-300 text-xl mb-8">
                  {status === 'lobby'
                    ? 'The host is setting up the game...'
                    : 'The host is choosing categories...'}
                </p>
                <div className="text-center">
                  <p className="text-blue-400 text-lg mb-2">Room Code</p>
                  <p className="text-5xl font-bold text-yellow-400 tracking-widest">{roomCode}</p>
                </div>
                {players.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-blue-700">
                    <p className="text-blue-300 mb-3">{players.length} player{players.length !== 1 ? 's' : ''} joined</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {players.map(p => (
                        <span key={p.id} className="bg-blue-800 px-3 py-1 rounded-full text-white text-sm">
                          {p.name} {p.isHost && '(Host)'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Game Playing State */}
          {(status === 'playing' || status === 'question' || status === 'buzzing') && board && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Board */}
              <div className="lg:col-span-3">
                <JeopardyBoard
                  board={board}
                  onSelectQuestion={() => {}} // No interaction in spectator mode
                  isHost={false}
                  disabled={true}
                />
              </div>

              {/* Sidebar - Scoreboard */}
              <div className="lg:col-span-1">
                <Scoreboard players={players} hostId={hostId} teams={teams} isTeamMode={isTeamMode} />
              </div>
            </div>
          )}

          {/* Game Finished */}
          {status === 'finished' && (
            <div className="text-center py-12">
              <h2 className="text-5xl font-bold text-yellow-400 mb-8">Game Over!</h2>
              <div className="max-w-md mx-auto">
                <Scoreboard players={players} hostId={hostId} teams={teams} isTeamMode={isTeamMode} />
              </div>
            </div>
          )}
        </main>

        {/* Question Overlay for Spectators */}
        {currentQuestionDisplay && (status === 'question' || status === 'buzzing') && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-8">
            <div className="bg-blue-900 rounded-3xl max-w-5xl w-full shadow-2xl border-4 border-yellow-500 overflow-hidden">
              {/* Header */}
              <div className="bg-blue-800 px-8 py-5">
                <span className="text-yellow-400 font-bold text-2xl">
                  {currentQuestionDisplay.category} - ${currentQuestionDisplay.value}
                  {currentQuestionDisplay.isDailyDouble && (
                    <span className="ml-3 bg-yellow-500 text-blue-900 px-3 py-1 rounded text-lg animate-pulse">
                      DAILY DOUBLE!
                    </span>
                  )}
                </span>
              </div>

              {/* Question */}
              <div className="p-12">
                <p className="text-3xl md:text-4xl lg:text-5xl text-white text-center font-medium leading-relaxed">
                  {currentQuestionDisplay.question}
                </p>
              </div>

              {/* Buzzed Player Display */}
              {buzzedPlayerName && (
                <div className="px-8 pb-6">
                  <div className="text-center p-6 rounded-xl bg-yellow-600 animate-pulse">
                    <p className="text-3xl font-bold text-white">
                      {buzzedPlayerName} buzzed in!
                    </p>
                  </div>
                </div>
              )}

              {/* Answer (only when host broadcasts to all) */}
              {showAnswer && (
                <div className="px-8 pb-8">
                  <div className="bg-green-800/50 border-2 border-green-500 rounded-xl p-8">
                    <p className="text-2xl md:text-3xl text-green-300 text-center font-medium">
                      {currentQuestionDisplay.answer}
                    </p>
                  </div>
                </div>
              )}

              {/* Waiting indicator when no one has buzzed */}
              {!buzzedPlayerName && !showAnswer && (
                <div className="px-8 pb-8">
                  <div className="text-center p-4">
                    <p className="text-blue-300 text-xl animate-pulse">
                      Waiting for players to buzz in...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final Jeopardy Display */}
        {(status === 'final-jeopardy-wager' || status === 'final-jeopardy-question' || status === 'final-jeopardy-reveal') && finalJeopardy && (
          <div className="fixed inset-0 bg-blue-950 flex items-center justify-center z-50 p-8">
            <div className="max-w-4xl w-full text-center">
              <h2 className="text-5xl font-bold text-yellow-400 mb-8 animate-pulse">
                FINAL JEOPARDY!
              </h2>

              <div className="bg-blue-900 rounded-2xl p-8 border-4 border-yellow-500 mb-8">
                <p className="text-3xl text-yellow-400 font-bold mb-6">
                  Category: {finalJeopardy.category}
                </p>

                {status === 'final-jeopardy-wager' && (
                  <p className="text-2xl text-blue-300">
                    Players are placing their wagers...
                  </p>
                )}

                {(status === 'final-jeopardy-question' || status === 'final-jeopardy-reveal') && (
                  <p className="text-3xl text-white leading-relaxed">
                    {finalJeopardy.question}
                  </p>
                )}

                {status === 'final-jeopardy-reveal' && finalJeopardy.showAnswers && (
                  <div className="mt-8 pt-6 border-t border-blue-700">
                    <p className="text-2xl text-green-400 font-medium">
                      Answer: {finalJeopardy.answer}
                    </p>
                  </div>
                )}
              </div>

              {/* Player scores during Final Jeopardy */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {players.filter(p => !p.isSpectator).map(player => (
                  <div key={player.id} className="bg-blue-800 rounded-xl p-4">
                    <p className="text-white font-semibold truncate">{player.name}</p>
                    <p className="text-2xl font-bold text-yellow-400">${player.score}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
