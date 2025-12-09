'use client';

import { useEffect, useState, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../lib/gameStore';
import { getPusherClient, getGameChannel, JEOPARDY_EVENTS as GAME_EVENTS } from '@shared/lib/pusher';
import { Player, Question, GameState } from '../../types/game';
import { initSounds, playSound, playFeedback } from '../../lib/sounds';
import JeopardyBoard from '../../components/JeopardyBoard';
import QuestionModal from '../../components/QuestionModal';
import DailyDoubleModal from '../../components/DailyDoubleModal';
import FinalJeopardy from '../../components/FinalJeopardy';
import Scoreboard from '../../components/Scoreboard';
import CategorySelector from '../../components/CategorySelector';
import Lobby from '../../components/Lobby';
import BuzzerButton from '../../components/BuzzerButton';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import WaitingRoom from '../../components/WaitingRoom';
import GameInstructions from '../../components/GameInstructions';
import HostControls from '../../components/HostControls';
import HostDisconnectedOverlay from '../../components/HostDisconnectedOverlay';
import GameEndedOverlay from '../../components/GameEndedOverlay';
import InvitePanel from '@shared/components/InvitePanel';
import BuzzNotification from '../../components/BuzzNotification';

export default function JeopardyGamePage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();

  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [canBuzz, setCanBuzz] = useState(false);
  const [showDailyDoubleAnswer, setShowDailyDoubleAnswer] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [showBuzzNotification, setShowBuzzNotification] = useState(false);
  const [buzzedPlayerName, setBuzzedPlayerName] = useState('');

  // Host management states
  const [hostDisconnected, setHostDisconnected] = useState(false);
  const [hostDisconnectedAt, setHostDisconnectedAt] = useState<number | null>(null);
  const [hostName, setHostName] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [gameEndReason, setGameEndReason] = useState<'host-timeout' | 'host-ended' | 'inactivity'>('host-ended');
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const hostHeartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityCheckRef = useRef<NodeJS.Timeout | null>(null);
  const lastHostHeartbeatRef = useRef<number>(Date.now());

  // Constants
  const HOST_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const HOST_HEARTBEAT_INTERVAL = 10 * 1000; // 10 seconds
  const HOST_HEARTBEAT_THRESHOLD = 30 * 1000; // 30 seconds without heartbeat = disconnected
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Connection limit states
  const [inWaitingRoom, setInWaitingRoom] = useState(false);
  const [waitingPosition, setWaitingPosition] = useState(0);
  const [waitingReason, setWaitingReason] = useState('');
  const [connectionChecked, setConnectionChecked] = useState(false);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    status,
    players,
    board,
    currentQuestion,
    buzzedPlayer,
    buzzOrder,
    hostId,
    round,
    dailyDoubleState,
    finalJeopardy,
    isTeamMode,
    teams,
    soundEnabled,
    setRoomCode,
    setHostId,
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
    startDoubleJeopardy,
    setDailyDoubleWager,
    resolveDailyDouble,
    startFinalJeopardy,
    setFinalJeopardyWager,
    setFinalJeopardyAnswer,
    revealFinalJeopardy,
    judgeFinalJeopardy,
    enableTeamMode,
    createTeam,
    joinTeam,
    addWrongAnswerer,
    wrongAnswerers,
    fullReset,
  } = useGameStore();

  // Clear any previous game state when entering a new room
  useEffect(() => {
    // Reset state when room code changes to prevent stale data
    fullReset();
  }, [roomCode, fullReset]);

  // Initialize sounds on mount
  useEffect(() => {
    initSounds();
  }, []);

  // Check connection limits and register connection
  const checkAndRegisterConnection = useCallback(async (pid: string, pname: string) => {
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          odId: pid,
          roomCode,
          playerName: pname,
        }),
      });

      const data = await res.json();

      if (!data.success && data.inWaitingRoom) {
        setInWaitingRoom(true);
        setWaitingPosition(data.position);
        setWaitingReason(data.reason);
        return false;
      }

      setInWaitingRoom(false);
      return true;
    } catch (error) {
      console.error('Connection check failed:', error);
      return true; // Allow connection on error to not block users
    }
  }, [roomCode]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      if (playerId) {
        // Fire and forget disconnect
        fetch('/api/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'disconnect', odId: playerId }),
        }).catch(() => {});
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [playerId]);

  // Initialize player from sessionStorage
  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    const storedPlayerName = sessionStorage.getItem('playerName');
    const storedIsHost = sessionStorage.getItem('isHost') === 'true';

    if (!storedPlayerId || !storedPlayerName) {
      router.push('/jeopardy');
      return;
    }

    setPlayerId(storedPlayerId);
    setPlayerName(storedPlayerName);
    setIsHost(storedIsHost);
    setRoomCode(roomCode);

    // Check for study mode
    const studyMode = sessionStorage.getItem('isStudyMode') === 'true';
    setIsStudyMode(studyMode);

    if (storedIsHost) {
      setHostId(storedPlayerId);

      // Initialize team mode if selected
      const gameMode = sessionStorage.getItem('gameMode');
      if (gameMode === 'team') {
        enableTeamMode();
        const redName = sessionStorage.getItem('teamRedName') || 'Red Team';
        const blueName = sessionStorage.getItem('teamBlueName') || 'Blue Team';
        createTeam(redName, '#ef4444');
        createTeam(blueName, '#3b82f6');
      }

      // In study mode, skip lobby and go to category select
      if (studyMode) {
        setStatus('category-select');
      }
    }

    // Check connection limits before joining
    checkAndRegisterConnection(storedPlayerId, storedPlayerName).then((allowed) => {
      setConnectionChecked(true);

      if (allowed) {
        // Add self as player
        const player: Player = {
          id: storedPlayerId,
          name: storedPlayerName,
          score: 0,
          isHost: storedIsHost,
          isSpectator: false,
          connectedAt: Date.now(),
        };
        addPlayer(player);

        // Broadcast to other players that we joined
        fetch('/api/game/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode,
            event: 'player-joined',
            data: player,
          }),
        }).catch((err) => console.error('Failed to broadcast join:', err));

        // Start heartbeat ping every 30 seconds
        pingIntervalRef.current = setInterval(() => {
          fetch('/api/connections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ping', odId: storedPlayerId }),
          }).catch(() => {});
        }, 30000);
      }
    });
  }, [roomCode, router, setRoomCode, setHostId, addPlayer, checkAndRegisterConnection, enableTeamMode, createTeam, setStatus]);

  // Broadcast game event to other players
  const broadcastEvent = useCallback(async (event: string, data: unknown) => {
    try {
      await fetch('/api/game/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, event, data }),
      });
    } catch (error) {
      console.error('Failed to broadcast event:', error);
    }
  }, [roomCode]);

  // Track activity for inactivity timeout
  const updateActivity = useCallback(() => {
    setLastActivityTime(Date.now());
  }, []);

  // Host heartbeat broadcast (if host)
  useEffect(() => {
    if (!isHost || !playerId || isStudyMode) return;

    // Send heartbeat immediately
    broadcastEvent(GAME_EVENTS.HOST_HEARTBEAT, { hostId: playerId, timestamp: Date.now() });

    // Send heartbeat every 10 seconds
    hostHeartbeatRef.current = setInterval(() => {
      broadcastEvent(GAME_EVENTS.HOST_HEARTBEAT, { hostId: playerId, timestamp: Date.now() });
    }, HOST_HEARTBEAT_INTERVAL);

    return () => {
      if (hostHeartbeatRef.current) {
        clearInterval(hostHeartbeatRef.current);
      }
    };
  }, [isHost, playerId, isStudyMode, broadcastEvent, HOST_HEARTBEAT_INTERVAL]);

  // Non-host: Check for host heartbeat timeout
  useEffect(() => {
    if (isHost || !playerId || isStudyMode || status === 'lobby') return;

    const checkHostHeartbeat = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHostHeartbeatRef.current;

      if (timeSinceLastHeartbeat > HOST_HEARTBEAT_THRESHOLD && !hostDisconnected && !gameEnded) {
        // Host hasn't sent heartbeat - mark as disconnected
        setHostDisconnected(true);
        setHostDisconnectedAt(Date.now());
        // Get host name from players
        const host = players.find(p => p.isHost);
        if (host) setHostName(host.name);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkHostHeartbeat);
  }, [isHost, playerId, isStudyMode, status, hostDisconnected, gameEnded, players, HOST_HEARTBEAT_THRESHOLD]);

  // Inactivity timeout (30 minutes)
  useEffect(() => {
    if (!playerId || isStudyMode) return;

    inactivityCheckRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityTime;

      if (timeSinceActivity > INACTIVITY_TIMEOUT && !gameEnded) {
        // End game due to inactivity
        setGameEnded(true);
        setGameEndReason('inactivity');
        if (isHost) {
          broadcastEvent(GAME_EVENTS.GAME_ENDED, { reason: 'inactivity' });
        }
      }
    }, 60000); // Check every minute

    return () => {
      if (inactivityCheckRef.current) {
        clearInterval(inactivityCheckRef.current);
      }
    };
  }, [playerId, isStudyMode, lastActivityTime, gameEnded, isHost, broadcastEvent, INACTIVITY_TIMEOUT]);

  // Handle host timeout (5 minutes)
  const handleHostTimeout = useCallback(() => {
    setGameEnded(true);
    setGameEndReason('host-timeout');
  }, []);

  // Handle host reconnection
  const handleHostReconnected = useCallback(() => {
    setHostDisconnected(false);
    setHostDisconnectedAt(null);
  }, []);

  // Handle end game (by host)
  const handleEndGame = useCallback(() => {
    setGameEnded(true);
    setGameEndReason('host-ended');
    broadcastEvent(GAME_EVENTS.GAME_ENDED, { reason: 'host-ended', hostName: playerName });
  }, [broadcastEvent, playerName]);

  // Handle host transfer
  const handleTransferHost = useCallback((newHostId: string) => {
    const newHost = players.find(p => p.id === newHostId);
    if (!newHost) return;

    // Broadcast host transfer
    broadcastEvent(GAME_EVENTS.HOST_TRANSFERRED, {
      oldHostId: playerId,
      newHostId,
      newHostName: newHost.name
    });

    // Leave the game (original host is no longer a player)
    router.push('/jeopardy');
  }, [broadcastEvent, playerId, players, router]);

  // Pusher real-time subscription
  useEffect(() => {
    if (!playerId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(getGameChannel(roomCode));

    channel.bind(GAME_EVENTS.PLAYER_JOINED, (data: Player) => {
      addPlayer(data);
      if (soundEnabled) playSound('select');
      updateActivity();

      // Host: broadcast current game state to sync the new player
      if (isHost && status !== 'lobby') {
        setTimeout(() => {
          fetch('/api/game/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomCode,
              event: GAME_EVENTS.STATE_SYNC,
              data: {
                status,
                board,
                round,
                players,
                isTeamMode,
                teams,
              },
            }),
          }).catch((err) => console.error('Failed to sync state:', err));
        }, 500); // Small delay to ensure new player is subscribed
      }
    });

    channel.bind(GAME_EVENTS.PLAYER_LEFT, (data: { playerId: string }) => {
      removePlayer(data.playerId);
    });

    channel.bind(GAME_EVENTS.GAME_STARTED, (data: { categoryIds: string[] }) => {
      initializeBoard(data.categoryIds);
      if (soundEnabled) playSound('select');
    });

    channel.bind(GAME_EVENTS.QUESTION_SELECTED, (data: { question: Question }) => {
      selectQuestion(data.question);
      setCanBuzz(true);
      if (data.question.isDailyDouble && soundEnabled) {
        playSound('dailyDouble');
      }
    });

    channel.bind(GAME_EVENTS.PLAYER_BUZZED, (data: { playerId: string; time: number }) => {
      playerBuzz(data.playerId, data.time);
      setCanBuzz(false);
      if (soundEnabled) playSound('buzz');

      // Show buzz notification for host
      const buzzedPlayer = players.find(p => p.id === data.playerId);
      if (buzzedPlayer) {
        setBuzzedPlayerName(buzzedPlayer.name);
        setShowBuzzNotification(true);
      }
    });

    channel.bind(GAME_EVENTS.ANSWER_JUDGED, (data: { playerId: string; correct: boolean; newScore: number }) => {
      updatePlayerScore(data.playerId, data.newScore);
      if (soundEnabled) playSound(data.correct ? 'correct' : 'wrong');
    });

    channel.bind(GAME_EVENTS.QUESTION_CLOSED, (data: { questionId: string }) => {
      markQuestionAnswered(data.questionId);
      setShowAnswer(false);
      setCanBuzz(false);
    });

    channel.bind(GAME_EVENTS.REVEAL_ANSWER, () => {
      setShowAnswer(true);
    });

    channel.bind(GAME_EVENTS.BUZZ_RESET, (data: { wrongPlayerId?: string }) => {
      resetBuzz();
      setCanBuzz(true);
      // Track who answered wrong so they can't buzz again
      if (data?.wrongPlayerId) {
        addWrongAnswerer(data.wrongPlayerId);
      }
    });

    channel.bind(GAME_EVENTS.GAME_STATE_UPDATE, (data: Record<string, unknown>) => {
      updateGameState(data as Partial<GameState>);
      updateActivity();
    });

    // Host management events
    channel.bind(GAME_EVENTS.HOST_HEARTBEAT, (data: { hostId: string; timestamp: number }) => {
      lastHostHeartbeatRef.current = Date.now();
      // If we were showing disconnect overlay, host is back
      if (hostDisconnected) {
        handleHostReconnected();
      }
    });

    channel.bind(GAME_EVENTS.GAME_ENDED, (data: { reason: 'host-timeout' | 'host-ended' | 'inactivity'; hostName?: string }) => {
      setGameEnded(true);
      setGameEndReason(data.reason);
      if (data.hostName) setHostName(data.hostName);
    });

    channel.bind(GAME_EVENTS.HOST_TRANSFERRED, (data: { oldHostId: string; newHostId: string; newHostName: string }) => {
      // If I'm the new host, update my state
      if (data.newHostId === playerId) {
        setIsHost(true);
        setHostId(data.newHostId);
        sessionStorage.setItem('isHost', 'true');
      }
      // Update host in player list
      updateGameState({ hostId: data.newHostId });
      updateActivity();
    });

    // State sync for late joiners
    channel.bind(GAME_EVENTS.STATE_SYNC, (data: {
      status: string;
      board: typeof board;
      round: number;
      players: typeof players;
      isTeamMode: boolean;
      teams: typeof teams;
    }) => {
      // Only sync if we're in lobby (meaning we just joined)
      if (status === 'lobby' && !isHost) {
        console.log('Syncing game state from host:', data.status);
        setStatus(data.status as typeof status);
        if (data.board) {
          setBoard(data.board);
        }
        if (data.round === 1 || data.round === 2) {
          setRound(data.round);
        }
        // Sync players
        data.players?.forEach((p: Player) => {
          if (p.id !== playerId) {
            addPlayer(p);
          }
        });
        // Sync team mode
        if (data.isTeamMode) {
          enableTeamMode();
        }
      }
    });

    setIsConnected(true);

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(getGameChannel(roomCode));
    };
  }, [playerId, roomCode, soundEnabled, addPlayer, removePlayer, initializeBoard, selectQuestion, playerBuzz, updatePlayerScore, markQuestionAnswered, resetBuzz, updateGameState, updateActivity, hostDisconnected, handleHostReconnected, setHostId, players, isHost, status, board, round, isTeamMode, teams, setStatus, setBoard, setRound, enableTeamMode, addWrongAnswerer]);

  // Handle category selection and game start
  const handleStartGame = (categoryIds: string[]) => {
    initializeBoard(categoryIds);
    broadcastEvent(GAME_EVENTS.GAME_STARTED, { categoryIds });
    if (soundEnabled) playSound('select');
    updateActivity();
  };

  // Handle question selection
  const handleSelectQuestion = (question: Question) => {
    selectQuestion(question);
    setCanBuzz(true);
    setShowAnswer(false);
    broadcastEvent(GAME_EVENTS.QUESTION_SELECTED, { question });
    if (question.isDailyDouble && soundEnabled) {
      playSound('dailyDouble');
    } else if (soundEnabled) {
      playSound('select');
    }
    updateActivity();
  };

  // Handle player buzz
  const handleBuzz = () => {
    if (!canBuzz || buzzedPlayer) return;
    const time = Date.now();
    playerBuzz(playerId, time);
    setCanBuzz(false);
    broadcastEvent(GAME_EVENTS.PLAYER_BUZZED, { playerId, time });
    if (soundEnabled) playFeedback('buzz', 100);
    updateActivity();
  };

  // Handle answer judgment (host only)
  const handleJudge = (correct: boolean) => {
    if (!currentQuestion) return;

    // Determine who to score - buzzedPlayer or host (for self-scoring in solo play)
    const playerToScore = buzzedPlayer || players.find(p => p.id === playerId);
    if (!playerToScore) return;

    const pointChange = correct ? currentQuestion.value : -currentQuestion.value;
    const newScore = playerToScore.score + pointChange;
    updatePlayerScore(playerToScore.id, newScore);

    broadcastEvent(GAME_EVENTS.ANSWER_JUDGED, {
      playerId: playerToScore.id,
      correct,
      newScore,
    });

    if (soundEnabled) playSound(correct ? 'correct' : 'wrong');
    updateActivity();

    if (correct || !buzzedPlayer) {
      // Close question if correct OR if self-scoring (no buzzedPlayer)
      handleCloseQuestion();
    } else {
      // Wrong answer with buzzer - track who got it wrong, allow others to try
      addWrongAnswerer(playerToScore.id);
      resetBuzz();
      setCanBuzz(true);
      broadcastEvent(GAME_EVENTS.BUZZ_RESET, { wrongPlayerId: playerToScore.id });
    }
  };

  // Handle reveal answer
  const handleRevealAnswer = () => {
    setShowAnswer(true);
    broadcastEvent(GAME_EVENTS.REVEAL_ANSWER, {});
  };

  // Handle closing question
  const handleCloseQuestion = () => {
    if (!currentQuestion) return;
    markQuestionAnswered(currentQuestion.id, buzzedPlayer?.id);
    setShowAnswer(false);
    setCanBuzz(false);
    broadcastEvent(GAME_EVENTS.QUESTION_CLOSED, { questionId: currentQuestion.id });

    // Check if round is complete
    if (board) {
      const allAnswered = board.categories.every(cat =>
        cat.questions.every(q => q.isAnswered || q.id === currentQuestion.id)
      );

      if (allAnswered && round === 1) {
        // Offer to start Double Jeopardy
        setTimeout(() => {
          if (isHost && confirm('Round 1 complete! Start Double Jeopardy?')) {
            startDoubleJeopardy();
          }
        }, 500);
      } else if (allAnswered && round === 2) {
        // Start Final Jeopardy
        setTimeout(() => {
          startFinalJeopardy();
          if (soundEnabled) playSound('finalJeopardy');
        }, 500);
      }
    }
  };

  // Daily Double handlers
  const handleDailyDoubleWager = (wager: number) => {
    setDailyDoubleWager(wager);
    broadcastEvent('daily-double-wager', { wager });
  };

  const handleDailyDoubleJudge = (correct: boolean) => {
    resolveDailyDouble(correct);
    if (soundEnabled) playSound(correct ? 'correct' : 'wrong');
    broadcastEvent('daily-double-judge', { correct });
  };

  const handleDailyDoubleClose = () => {
    if (dailyDoubleState) {
      markQuestionAnswered(dailyDoubleState.question.id, dailyDoubleState.answered ? dailyDoubleState.playerId : undefined);
    }
    setShowDailyDoubleAnswer(false);
  };

  // Final Jeopardy handlers
  const handleFinalJeopardyStartQuestion = () => {
    setStatus('final-jeopardy-question');
    broadcastEvent('final-jeopardy-start-question', {});
  };

  const handleFinishGame = () => {
    setStatus('finished');
    if (soundEnabled) playSound('gameOver');
  };

  // Waiting room retry handler
  const handleWaitingRetry = useCallback(() => {
    if (playerId && playerName) {
      checkAndRegisterConnection(playerId, playerName).then((allowed) => {
        if (allowed) {
          // Add self as player
          const player: Player = {
            id: playerId,
            name: playerName,
            score: 0,
            isHost,
            isSpectator: false,
            connectedAt: Date.now(),
          };
          addPlayer(player);

          // Start heartbeat ping
          pingIntervalRef.current = setInterval(() => {
            fetch('/api/connections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'ping', odId: playerId }),
            }).catch(() => {});
          }, 30000);
        }
      });
    }
  }, [playerId, playerName, isHost, checkAndRegisterConnection, addPlayer]);

  // Waiting room - show when at capacity
  if (connectionChecked && inWaitingRoom) {
    return (
      <WaitingRoom
        position={waitingPosition}
        reason={waitingReason}
        roomCode={roomCode}
        onRetry={handleWaitingRetry}
        onCancel={() => router.push('/jeopardy')}
      />
    );
  }

  // Loading state
  if (!isConnected || !playerId || !connectionChecked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center">
        <LoadingSpinner message="Connecting to game..." size="lg" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 p-4">
        {/* Header */}
        <header className="max-w-6xl mx-auto mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
                BIBLE JEOPARDY
                {round === 2 && <span className="ml-2 text-lg">- Double Jeopardy!</span>}
                {isStudyMode && (
                  <span className="ml-2 text-lg text-green-400">- Study Mode</span>
                )}
              </h1>
              {isStudyMode ? (
                <p className="text-green-300 text-sm flex items-center gap-1">
                  <span>📖</span> Practice at your own pace
                </p>
              ) : (
                <p className="text-blue-300 text-sm">Room: {roomCode}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white">
                Playing as: <strong className="text-yellow-400">{playerName}</strong>
                {isHost && <span className="ml-2 text-xs bg-yellow-500 text-blue-900 px-2 py-0.5 rounded">HOST</span>}
              </span>
              <button
                onClick={() => setShowHelpModal(true)}
                className="p-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
                title="How to Play"
                aria-label="Show game instructions"
              >
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <a
                href="mailto:info@aiqso.io?subject=Bible%20Jeopardy%20Feedback"
                className="p-2 bg-blue-800 hover:bg-blue-700 rounded-lg transition-colors"
                title="Send Feedback"
                aria-label="Send feedback via email"
              >
                <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
              {/* Host Controls */}
              {isHost && status !== 'lobby' && (
                <HostControls
                  players={players}
                  currentPlayerId={playerId}
                  onTransferHost={handleTransferHost}
                  onEndGame={handleEndGame}
                  isStudyMode={isStudyMode}
                />
              )}
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto">
          {/* Lobby State */}
          {status === 'lobby' && (
            <Lobby
              roomCode={roomCode}
              players={players}
              isHost={isHost}
              onStartCategorySelect={() => {
                setStatus('category-select');
                broadcastEvent(GAME_EVENTS.GAME_STATE_UPDATE, { status: 'category-select' });
              }}
            />
          )}

          {/* Category Selection (Host Only) */}
          {status === 'category-select' && isHost && (
            <CategorySelector
              onStartGame={handleStartGame}
              onCancel={() => {
                if (isStudyMode) {
                  // In study mode, go back to home
                  sessionStorage.removeItem('isStudyMode');
                  router.push('/jeopardy');
                } else {
                  setStatus('lobby');
                  broadcastEvent(GAME_EVENTS.GAME_STATE_UPDATE, { status: 'lobby' });
                }
              }}
              isStudyMode={isStudyMode}
            />
          )}

          {/* Waiting for host to select categories */}
          {status === 'category-select' && !isHost && (
            <div className="text-center py-12">
              <LoadingSpinner message="Host is selecting categories..." />
            </div>
          )}

          {/* Game Playing State */}
          {(status === 'playing' || status === 'question' || status === 'buzzing') && board && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Board */}
              <div className="lg:col-span-3">
                <JeopardyBoard
                  board={board}
                  onSelectQuestion={handleSelectQuestion}
                  isHost={isHost}
                  disabled={status !== 'playing'}
                />
              </div>

              {/* Sidebar - Scoreboard, Invite & Instructions */}
              <div className="lg:col-span-1 space-y-4">
                <Scoreboard players={players} hostId={hostId} teams={teams} isTeamMode={isTeamMode} />
                {/* Invite Panel - show for host when not in study mode */}
                {isHost && !isStudyMode && (
                  <InvitePanel roomCode={roomCode} compact={true} />
                )}
                <GameInstructions isHost={isHost} isTeamMode={isTeamMode} compact={true} />
              </div>
            </div>
          )}

          {/* Daily Double */}
          {status === 'daily-double' && dailyDoubleState && (
            <DailyDoubleModal
              dailyDouble={dailyDoubleState}
              player={players.find(p => p.id === dailyDoubleState.playerId) || players[0]}
              isHost={isHost}
              isCurrentPlayer={playerId === dailyDoubleState.playerId}
              onSetWager={handleDailyDoubleWager}
              onJudge={handleDailyDoubleJudge}
              onRevealAnswer={() => setShowDailyDoubleAnswer(true)}
              onClose={handleDailyDoubleClose}
              showAnswer={showDailyDoubleAnswer}
            />
          )}

          {/* Final Jeopardy */}
          {(status === 'final-jeopardy-wager' || status === 'final-jeopardy-question' || status === 'final-jeopardy-reveal') && finalJeopardy && (
            <FinalJeopardy
              finalJeopardy={finalJeopardy}
              players={players}
              currentPlayerId={playerId}
              isHost={isHost}
              onSetWager={setFinalJeopardyWager}
              onSetAnswer={setFinalJeopardyAnswer}
              onStartQuestion={handleFinalJeopardyStartQuestion}
              onReveal={revealFinalJeopardy}
              onJudge={judgeFinalJeopardy}
              onFinishGame={handleFinishGame}
              status={status}
            />
          )}

          {/* Game Finished */}
          {status === 'finished' && (
            <div className="text-center py-12">
              <h2 className="text-4xl font-bold text-yellow-400 mb-6">Game Over!</h2>
              <Scoreboard players={players} hostId={hostId} teams={teams} isTeamMode={isTeamMode} />
              {isHost && (
                <button
                  onClick={() => {
                    if (confirm('Start a new game? All scores will be reset.')) {
                      setStatus('lobby');
                      players.forEach(p => updatePlayerScore(p.id, 0));
                      setRound(1);
                    }
                  }}
                  className="mt-6 px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold rounded-xl
                             focus:outline-none focus:ring-4 focus:ring-yellow-300"
                >
                  Play Again
                </button>
              )}
            </div>
          )}
        </main>

        {/* Question Modal */}
        {currentQuestion && (status === 'question' || status === 'buzzing') && (
          <QuestionModal
            question={currentQuestion}
            buzzedPlayer={buzzedPlayer}
            isHost={isHost}
            showAnswer={showAnswer}
            onBuzz={handleBuzz}
            onJudge={handleJudge}
            onRevealAnswer={handleRevealAnswer}
            onClose={handleCloseQuestion}
            canBuzz={canBuzz && !buzzedPlayer}
            playerId={playerId}
            buzzOrder={buzzOrder}
            players={players}
            wrongAnswerers={wrongAnswerers}
          />
        )}

        {/* Buzzer for non-host players (shows at bottom of screen during questions) */}
        {!isHost && (status === 'question' || status === 'buzzing') && !currentQuestion && (
          <BuzzerButton
            onBuzz={handleBuzz}
            disabled={!canBuzz || !!buzzedPlayer}
            buzzedPlayerName={buzzedPlayer?.name}
            isCurrentBuzzer={buzzedPlayer?.id === playerId}
          />
        )}

        {/* Help Modal */}
        {showHelpModal && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowHelpModal(false)}
          >
            <div
              className="bg-blue-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-blue-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-blue-900 px-6 py-4 border-b border-blue-700 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-yellow-400">How to Play</h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
                  aria-label="Close help"
                >
                  <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <GameInstructions isHost={isHost} isTeamMode={isTeamMode} compact={false} />
              </div>
            </div>
          </div>
        )}

        {/* Host Disconnected Overlay */}
        {hostDisconnected && hostDisconnectedAt && !gameEnded && !isHost && (
          <HostDisconnectedOverlay
            hostName={hostName}
            disconnectedAt={hostDisconnectedAt}
            timeoutDuration={HOST_TIMEOUT}
            onTimeout={handleHostTimeout}
          />
        )}

        {/* Game Ended Overlay */}
        {gameEnded && (
          <GameEndedOverlay reason={gameEndReason} hostName={hostName} />
        )}

        {/* Buzz Notification for Host */}
        {showBuzzNotification && isHost && buzzedPlayerName && (
          <BuzzNotification
            playerName={buzzedPlayerName}
            onDismiss={() => setShowBuzzNotification(false)}
            autoDismissMs={4000}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
