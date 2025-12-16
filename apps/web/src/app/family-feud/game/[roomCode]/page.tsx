'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Channel } from 'pusher-js';
import { useGameStore } from '../../lib/gameStore';
import { Player, GameState } from '../../types/game';
import TeamLobby from '../../components/TeamLobby';
import SurveyBoard from '../../components/SurveyBoard';
import TeamScoreboard from '../../components/TeamScoreboard';
import FaceOff from '../../components/FaceOff';
import HostControls from '../../components/HostControls';
import StrikeDisplay from '../../components/StrikeDisplay';
import GameOver from '../../components/GameOver';
import HostDisconnectedOverlay from '../../components/HostDisconnectedOverlay';
import GameEndedOverlay from '../../components/GameEndedOverlay';
import FaceOffBuzzNotification from '../../components/FaceOffBuzzNotification';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import { getPusherClient, getGameChannel, FAMILY_FEUD_EVENTS } from '@shared/lib/pusher';
import { initSounds, playSound } from '@shared/lib/sounds';
import * as analytics from '@shared/lib/analytics';

export default function FamilyFeudGamePage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();

  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<Channel | null>(null);

  // Host management states
  const [hostDisconnected, setHostDisconnected] = useState(false);
  const [hostDisconnectedAt, setHostDisconnectedAt] = useState<number | null>(null);
  const [hostName, setHostName] = useState('');
  const [gameEnded, setGameEnded] = useState(false);
  const [gameEndReason, setGameEndReason] = useState<'host-timeout' | 'host-ended' | 'inactivity'>('host-ended');
  const hostHeartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const lastHostHeartbeatRef = useRef<number>(Date.now());

  // Face-off buzz notification
  const [showBuzzNotification, setShowBuzzNotification] = useState(false);
  const [buzzedTeamName, setBuzzedTeamName] = useState('');
  const [buzzedTeamColor, setBuzzedTeamColor] = useState<'red' | 'blue'>('red');

  // Constants
  const HOST_TIMEOUT = 5 * 60 * 1000; // 5 minutes
  const HOST_HEARTBEAT_INTERVAL = 10 * 1000; // 10 seconds
  const HOST_HEARTBEAT_THRESHOLD = 30 * 1000; // 30 seconds without heartbeat = disconnected

  const {
    status,
    players,
    teams,
    currentQuestion,
    controllingTeam,
    faceOffWinner,
    roundPoints,
    round,
    maxRounds,
    setRoomCode,
    setHostId,
    addPlayer,
    joinTeam,
    setTeamName,
    setStatus,
    startGame,
    faceOffBuzz,
    setFaceOffWinner,
    playOrPass,
    revealAnswer,
    addStrike,
    attemptSteal,
    awardRoundPoints,
    nextQuestion,
    resetGame,
    fullReset,
  } = useGameStore();

  // Initialize sounds on mount
  useEffect(() => {
    initSounds();
  }, []);

  // Get current player's team
  const currentPlayer = players.find(p => p.id === playerId);
  const playerTeam = currentPlayer?.teamId || null;

  // Broadcast event to all players
  const broadcast = useCallback(async (event: string, data: unknown) => {
    try {
      await fetch('/api/game/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, event, data }),
      });
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  }, [roomCode]);

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

  // Host heartbeat broadcast (if host)
  useEffect(() => {
    if (!isHost || !playerId) return;

    // Send heartbeat immediately
    broadcast(FAMILY_FEUD_EVENTS.HOST_HEARTBEAT, { hostId: playerId, timestamp: Date.now() });

    // Send heartbeat every 10 seconds
    hostHeartbeatRef.current = setInterval(() => {
      broadcast(FAMILY_FEUD_EVENTS.HOST_HEARTBEAT, { hostId: playerId, timestamp: Date.now() });
    }, HOST_HEARTBEAT_INTERVAL);

    return () => {
      if (hostHeartbeatRef.current) {
        clearInterval(hostHeartbeatRef.current);
      }
    };
  }, [isHost, playerId, broadcast, HOST_HEARTBEAT_INTERVAL]);

  // Non-host: Check for host heartbeat timeout
  useEffect(() => {
    if (isHost || !playerId || status === 'lobby') return;

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
  }, [isHost, playerId, status, hostDisconnected, gameEnded, players, HOST_HEARTBEAT_THRESHOLD]);

  // Initialize player from sessionStorage and set up Pusher
  useEffect(() => {
    const storedPlayerId = sessionStorage.getItem('playerId');
    const storedPlayerName = sessionStorage.getItem('playerName');
    const storedIsHost = sessionStorage.getItem('isHost') === 'true';

    if (!storedPlayerId || !storedPlayerName) {
      router.push('/family-feud');
      return;
    }

    setPlayerId(storedPlayerId);
    setPlayerName(storedPlayerName);
    setIsHost(storedIsHost);
    setRoomCode(roomCode);

    if (storedIsHost) {
      setHostId(storedPlayerId);
    }

    // Add self as player
    const player: Player = {
      id: storedPlayerId,
      name: storedPlayerName,
      teamId: null,
      isHost: storedIsHost,
      isCaptain: false,
    };
    addPlayer(player);

    // Set up Pusher connection
    const pusher = getPusherClient();
    const channelName = getGameChannel(roomCode);
    const channel = pusher.subscribe(channelName);
    channelRef.current = channel;

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      // Broadcast that we joined
      fetch('/api/game/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          event: FAMILY_FEUD_EVENTS.PLAYER_JOINED,
          data: player,
        }),
      });
    });

    // Listen for other players joining
    channel.bind(FAMILY_FEUD_EVENTS.PLAYER_JOINED, (data: Player) => {
      if (data.id !== storedPlayerId) {
        addPlayer(data);
      }
    });

    // Listen for team joins
    channel.bind(FAMILY_FEUD_EVENTS.TEAM_JOINED, (data: { playerId: string; teamId: 'red' | 'blue' }) => {
      if (data.playerId !== storedPlayerId) {
        joinTeam(data.playerId, data.teamId);
      }
    });

    // Listen for team name changes
    channel.bind(FAMILY_FEUD_EVENTS.TEAM_NAME_CHANGED, (data: { teamId: 'red' | 'blue'; name: string }) => {
      setTeamName(data.teamId, data.name);
    });

    // Listen for game start
    channel.bind(FAMILY_FEUD_EVENTS.GAME_STARTED, (data: { maxRounds: number }) => {
      startGame(data.maxRounds);
    });

    // Listen for face-off buzz
    channel.bind(FAMILY_FEUD_EVENTS.FACE_OFF_BUZZ, (data: { teamId: 'red' | 'blue' }) => {
      faceOffBuzz(data.teamId);
      // Show buzz notification for host
      const teamData = useGameStore.getState().teams[data.teamId];
      setBuzzedTeamName(teamData.name);
      setBuzzedTeamColor(data.teamId);
      setShowBuzzNotification(true);
    });

    // Listen for face-off winner selection
    channel.bind(FAMILY_FEUD_EVENTS.FACE_OFF_WINNER, (data: { winner: 'red' | 'blue' }) => {
      setFaceOffWinner(data.winner);
    });

    // Listen for play or pass decision
    channel.bind(FAMILY_FEUD_EVENTS.PLAY_OR_PASS, (data: { decision: 'play' | 'pass' }) => {
      playOrPass(data.decision);
    });

    // Listen for answer reveals
    channel.bind(FAMILY_FEUD_EVENTS.ANSWER_REVEALED, (data: { answerId: string }) => {
      revealAnswer(data.answerId);
    });

    // Listen for strikes
    channel.bind(FAMILY_FEUD_EVENTS.STRIKE, () => {
      addStrike();
    });

    // Listen for steal results
    channel.bind(FAMILY_FEUD_EVENTS.STEAL_RESULT, (data: { success: boolean }) => {
      attemptSteal(data.success);
    });

    // Listen for points awarded
    channel.bind(FAMILY_FEUD_EVENTS.ROUND_POINTS_AWARDED, (data: { teamId: 'red' | 'blue' }) => {
      awardRoundPoints(data.teamId);
    });

    // Listen for next question
    channel.bind(FAMILY_FEUD_EVENTS.NEXT_QUESTION, () => {
      nextQuestion();
    });

    // Listen for game end
    channel.bind(FAMILY_FEUD_EVENTS.GAME_ENDED, (data: { reason?: 'host-timeout' | 'host-ended' | 'inactivity'; hostName?: string }) => {
      if (data?.reason) {
        setGameEnded(true);
        setGameEndReason(data.reason);
        if (data.hostName) setHostName(data.hostName);
      } else {
        setStatus('finished');
      }
    });

    // Listen for host heartbeat
    channel.bind(FAMILY_FEUD_EVENTS.HOST_HEARTBEAT, () => {
      lastHostHeartbeatRef.current = Date.now();
      // If we were showing disconnect overlay, host is back
      if (hostDisconnected) {
        handleHostReconnected();
      }
    });

    // Listen for state sync requests (host responds)
    channel.bind(FAMILY_FEUD_EVENTS.REQUEST_STATE_SYNC, (data: { requesterId: string }) => {
      if (storedIsHost && data.requesterId !== storedPlayerId) {
        // Host sends full state to new player
        const gameState = useGameStore.getState();
        fetch('/api/game/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode,
            event: FAMILY_FEUD_EVENTS.STATE_SYNC,
            data: {
              targetId: data.requesterId,
              state: {
                players: gameState.players,
                teams: gameState.teams,
                status: gameState.status,
                currentQuestion: gameState.currentQuestion,
                controllingTeam: gameState.controllingTeam,
                faceOffWinner: gameState.faceOffWinner,
                roundPoints: gameState.roundPoints,
                round: gameState.round,
                maxRounds: gameState.maxRounds,
              },
            },
          }),
        });
      }
    });

    // Listen for state sync (non-hosts receive)
    channel.bind(FAMILY_FEUD_EVENTS.STATE_SYNC, (data: { targetId: string; state: Partial<GameState> }) => {
      if (data.targetId === storedPlayerId) {
        // Apply synced state
        const store = useGameStore.getState();
        if (data.state.players) {
          data.state.players.forEach(p => store.addPlayer(p));
        }
        if (data.state.teams) {
          if (data.state.teams.red) store.setTeamName('red', data.state.teams.red.name);
          if (data.state.teams.blue) store.setTeamName('blue', data.state.teams.blue.name);
        }
      }
    });

    // Request state sync if not host
    if (!storedIsHost) {
      setTimeout(() => {
        fetch('/api/game/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomCode,
            event: FAMILY_FEUD_EVENTS.REQUEST_STATE_SYNC,
            data: { requesterId: storedPlayerId },
          }),
        });
      }, 500);
    }

    // Cleanup
    return () => {
      channel.unbind_all();
      pusher.unsubscribe(channelName);
    };
  }, [roomCode, router, setRoomCode, setHostId, addPlayer, joinTeam, setTeamName, startGame, faceOffBuzz, setFaceOffWinner, playOrPass, revealAnswer, addStrike, attemptSteal, awardRoundPoints, nextQuestion, setStatus, hostDisconnected, handleHostReconnected]);

  // Handle joining a team
  const handleJoinTeam = (teamId: 'red' | 'blue') => {
    joinTeam(playerId, teamId);
    broadcast(FAMILY_FEUD_EVENTS.TEAM_JOINED, { playerId, teamId });
  };

  // Handle setting team name (host only)
  const handleSetTeamName = (teamId: 'red' | 'blue', name: string) => {
    setTeamName(teamId, name);
    broadcast(FAMILY_FEUD_EVENTS.TEAM_NAME_CHANGED, { teamId, name });
  };

  // Handle starting the game
  const handleStartGame = async () => {
    playSound('select');
    startGame(5); // 5 rounds
    broadcast(FAMILY_FEUD_EVENTS.GAME_STARTED, { maxRounds: 5 });

    // Track analytics
    analytics.trackFamilyFeudGameStarted({
      roomCode,
      redTeamName: teams.red.name,
      blueTeamName: teams.blue.name,
      redTeamPlayers: teams.red.players.length,
      blueTeamPlayers: teams.blue.players.length,
      questionCount: 5,
    });

    // Update server-side room status to prevent new joins
    try {
      await fetch(`/api/rooms/${roomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', status: 'playing' }),
      });
    } catch (error) {
      console.error('Failed to update room status:', error);
    }
  };

  // Handle face-off buzz
  const handleFaceOffBuzz = () => {
    if (playerTeam) {
      playSound('buzz');
      faceOffBuzz(playerTeam);
      broadcast(FAMILY_FEUD_EVENTS.FACE_OFF_BUZZ, { teamId: playerTeam });

      // Track analytics
      analytics.trackFamilyFeudFaceOff({
        roomCode,
        winningTeam: playerTeam,
        round,
      });
    }
  };

  // Handle host selecting face-off winner
  const handleSelectFaceOffWinner = (winner: 'red' | 'blue') => {
    setFaceOffWinner(winner);
    broadcast(FAMILY_FEUD_EVENTS.FACE_OFF_WINNER, { winner });
  };

  // Handle play or pass decision
  const handlePlayOrPass = (decision: 'play' | 'pass') => {
    playOrPass(decision);
    broadcast(FAMILY_FEUD_EVENTS.PLAY_OR_PASS, { decision });

    // Track analytics
    if (faceOffWinner) {
      analytics.trackFamilyFeudPlayOrPass({
        roomCode,
        team: faceOffWinner,
        decision,
        round,
      });
    }
  };

  // Handle revealing an answer (host only)
  const handleRevealAnswer = (answerId: string) => {
    const answer = currentQuestion?.answers.find(a => a.id === answerId);
    const answerRank = currentQuestion?.answers.findIndex(a => a.id === answerId) ?? 0;

    revealAnswer(answerId);
    broadcast(FAMILY_FEUD_EVENTS.ANSWER_REVEALED, { answerId });

    // Track analytics
    if (answer) {
      analytics.trackFamilyFeudAnswerRevealed({
        roomCode,
        points: answer.points,
        answerRank: answerRank + 1,
        round,
      });
    }
  };

  // Handle adding a strike
  const handleAddStrike = () => {
    const currentStrikes = controllingTeam ? teams[controllingTeam].strikes : 0;
    addStrike();
    broadcast(FAMILY_FEUD_EVENTS.STRIKE, {});

    // Track analytics
    if (controllingTeam) {
      analytics.trackFamilyFeudStrike({
        roomCode,
        team: controllingTeam,
        strikeCount: currentStrikes + 1,
        round,
      });
    }
  };

  // Handle steal attempt
  const handleStealSuccess = () => {
    const stealingTeam = controllingTeam === 'red' ? 'blue' : 'red';
    attemptSteal(true);
    broadcast(FAMILY_FEUD_EVENTS.STEAL_RESULT, { success: true });

    // Track analytics
    analytics.trackFamilyFeudSteal({
      roomCode,
      stealingTeam,
      success: true,
      pointsAtStake: roundPoints,
      round,
    });
  };

  const handleStealFail = () => {
    const stealingTeam = controllingTeam === 'red' ? 'blue' : 'red';
    attemptSteal(false);
    broadcast(FAMILY_FEUD_EVENTS.STEAL_RESULT, { success: false });

    // Track analytics
    analytics.trackFamilyFeudSteal({
      roomCode,
      stealingTeam,
      success: false,
      pointsAtStake: roundPoints,
      round,
    });
  };

  // Handle awarding points
  const handleAwardPoints = (teamId: 'red' | 'blue') => {
    awardRoundPoints(teamId);
    broadcast(FAMILY_FEUD_EVENTS.ROUND_POINTS_AWARDED, { teamId });

    // Track analytics
    analytics.trackFamilyFeudRoundComplete({
      roomCode,
      round,
      winningTeam: teamId,
      pointsAwarded: roundPoints,
      redTeamScore: teams.red.score + (teamId === 'red' ? roundPoints : 0),
      blueTeamScore: teams.blue.score + (teamId === 'blue' ? roundPoints : 0),
    });
  };

  // Handle next question
  const handleNextQuestion = () => {
    // Check if this is the last question before advancing
    const isLastQuestion = round >= maxRounds;

    nextQuestion();
    broadcast(FAMILY_FEUD_EVENTS.NEXT_QUESTION, {});

    // Track game finished if this was the last round
    if (isLastQuestion) {
      const winner = teams.red.score > teams.blue.score ? 'red' : 'blue';
      analytics.trackFamilyFeudGameFinished({
        roomCode,
        winner,
        redTeamName: teams.red.name,
        blueTeamName: teams.blue.name,
        redTeamScore: teams.red.score,
        blueTeamScore: teams.blue.score,
        totalRounds: maxRounds,
      });
    }
  };

  // Handle play again
  const handlePlayAgain = () => {
    resetGame();
    setStatus('lobby');
    broadcast(FAMILY_FEUD_EVENTS.GAME_STATE_UPDATE, { status: 'lobby' });
  };

  // Handle end game early
  const handleEndGame = async () => {
    setGameEnded(true);
    setGameEndReason('host-ended');
    setHostName(playerName);
    broadcast(FAMILY_FEUD_EVENTS.GAME_ENDED, { reason: 'host-ended', hostName: playerName });

    // Update server-side room status so it's removed from public rooms list
    try {
      await fetch(`/api/rooms/${roomCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update-status', status: 'finished' }),
      });
    } catch (error) {
      console.error('Failed to update room status:', error);
    }
  };

  // Loading state
  if (!isConnected || !playerId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow-400 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-xl">Connecting to game...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-red-900 p-4">
        {/* Header */}
        <header className="max-w-6xl mx-auto mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">BIBLE FAMILY FEUD</h1>
              <p className="text-red-300 text-sm">Room: {roomCode}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white">
                Playing as: <strong className="text-yellow-400">{playerName}</strong>
                {isHost && <span className="ml-2 text-xs bg-yellow-500 text-red-900 px-2 py-0.5 rounded">HOST</span>}
                {playerTeam && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    playerTeam === 'red' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                  }`}>
                    {teams[playerTeam].name}
                  </span>
                )}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto">
          {/* Lobby State - Team Selection */}
          {status === 'lobby' && (
            <TeamLobby
              roomCode={roomCode}
              players={players}
              teams={teams}
              isHost={isHost}
              currentPlayerId={playerId}
              onJoinTeam={handleJoinTeam}
              onSetTeamName={handleSetTeamName}
              onStartGame={handleStartGame}
            />
          )}

          {/* Face Off State */}
          {status === 'face-off' && currentQuestion && (
            <div className="space-y-6">
              <TeamScoreboard
                teams={teams}
                players={players}
                controllingTeam={controllingTeam}
                roundPoints={roundPoints}
                round={round}
                maxRounds={maxRounds}
              />
              <FaceOff
                teams={teams}
                question={currentQuestion.question}
                faceOffWinner={faceOffWinner}
                isHost={isHost}
                playerTeam={playerTeam}
                onBuzz={handleFaceOffBuzz}
                onSelectWinner={handleSelectFaceOffWinner}
                onPlayOrPass={handlePlayOrPass}
              />
            </div>
          )}

          {/* Playing State */}
          {(status === 'playing' || status === 'steal') && currentQuestion && (
            <div className="space-y-6">
              {/* Scoreboard */}
              <TeamScoreboard
                teams={teams}
                players={players}
                controllingTeam={controllingTeam}
                roundPoints={roundPoints}
                round={round}
                maxRounds={maxRounds}
              />

              {/* Strike Display */}
              {controllingTeam && teams[controllingTeam].strikes > 0 && (
                <div className="py-4">
                  <StrikeDisplay
                    strikes={teams[controllingTeam].strikes}
                    showAnimation={true}
                  />
                </div>
              )}

              {/* Steal Banner */}
              {status === 'steal' && (
                <div className="bg-orange-600 rounded-xl p-4 text-center border-4 border-yellow-400">
                  <p className="text-2xl font-bold text-white">
                    STEAL OPPORTUNITY!
                  </p>
                  <p className="text-orange-100">
                    {teams[controllingTeam === 'red' ? 'blue' : 'red'].name} can steal {roundPoints} points!
                  </p>
                </div>
              )}

              {/* Survey Board */}
              <SurveyBoard
                question={currentQuestion}
                onRevealAnswer={handleRevealAnswer}
                isHost={isHost}
                showQuestion={true}
              />

              {/* Host Controls */}
              {isHost && (
                <HostControls
                  status={status}
                  teams={teams}
                  controllingTeam={controllingTeam}
                  roundPoints={roundPoints}
                  onAddStrike={handleAddStrike}
                  onAwardPoints={handleAwardPoints}
                  onStealSuccess={handleStealSuccess}
                  onStealFail={handleStealFail}
                  onNextQuestion={handleNextQuestion}
                  onEndGame={handleEndGame}
                />
              )}
            </div>
          )}

          {/* Round End State */}
          {status === 'round-end' && currentQuestion && (
            <div className="space-y-6">
              <TeamScoreboard
                teams={teams}
                players={players}
                controllingTeam={controllingTeam}
                roundPoints={0}
                round={round}
                maxRounds={maxRounds}
              />

              {/* Show all answers */}
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-green-400">Round Complete!</h2>
                <p className="text-red-300">All answers revealed</p>
              </div>

              <SurveyBoard
                question={currentQuestion}
                isHost={false}
                showQuestion={true}
              />

              {/* Host Controls */}
              {isHost && (
                <HostControls
                  status={status}
                  teams={teams}
                  controllingTeam={controllingTeam}
                  roundPoints={roundPoints}
                  onAddStrike={handleAddStrike}
                  onAwardPoints={handleAwardPoints}
                  onStealSuccess={handleStealSuccess}
                  onStealFail={handleStealFail}
                  onNextQuestion={handleNextQuestion}
                  onEndGame={handleEndGame}
                />
              )}

              {!isHost && (
                <p className="text-center text-red-300">
                  Waiting for host to continue...
                </p>
              )}
            </div>
          )}

          {/* Game Finished */}
          {status === 'finished' && (
            <GameOver
              teams={teams}
              onPlayAgain={handlePlayAgain}
              isHost={isHost}
            />
          )}
        </main>

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

        {/* Face-Off Buzz Notification */}
        {showBuzzNotification && isHost && buzzedTeamName && (
          <FaceOffBuzzNotification
            teamName={buzzedTeamName}
            teamColor={buzzedTeamColor}
            onDismiss={() => setShowBuzzNotification(false)}
            autoDismissMs={4000}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
