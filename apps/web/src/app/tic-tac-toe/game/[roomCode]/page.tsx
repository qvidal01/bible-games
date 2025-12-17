'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../lib/gameStore';
import { getPusherClient, getGameChannel, TIC_TAC_TOE_EVENTS } from '@shared/lib/pusher';
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
import LoadingSpinner from '@shared/components/LoadingSpinner';
import InvitePanel from '@shared/components/InvitePanel';
import { Player, WIN_LINES, BoardState, EMPTY_BOARD } from '../../types/game';
import { getRandomQuestion } from '../../data/questions';

export default function TicTacToeGamePage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params);
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);

  const {
    status,
    players,
    board,
    currentTurn,
    currentQuestion,
    selectedCell,
    xWins,
    oWins,
    roundsToWin,
    currentRound,
    winner,
    matchWinner,
    difficulty,
    setRoomCode,
    setHostId,
    addPlayer,
    removePlayer,
    setStatus,
    startGame,
    selectCell,
    askQuestion,
    judgeAnswer,
    startNewRound,
    setRoundsToWin,
    setDifficulty,
    fullReset,
    updateGameState,
  } = useGameStore();

  // Get current player's symbol
  const mySymbol = players.find((p) => p.id === playerId)?.symbol;
  const isMyTurn = mySymbol === currentTurn;
  const opponent = players.find((p) => p.id !== playerId);

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
    const storedRounds = sessionStorage.getItem('ttt-roundsToWin');
    const storedDifficulty = sessionStorage.getItem('ttt-difficulty');

    if (!pid || !pname) {
      router.push(`/tic-tac-toe/join/${roomCode}`);
      return;
    }

    setPlayerId(pid);
    setIsHost(host);
    setRoomCode(roomCode);

    if (host) {
      setHostId(pid);
      if (storedRounds) setRoundsToWin(parseInt(storedRounds));
      if (storedDifficulty) setDifficulty(storedDifficulty as any);
    }

    // Add self to players
    const player: Player = {
      id: pid,
      name: pname,
      isHost: host,
      symbol: null,
      score: 0,
      connectedAt: Date.now(),
    };
    addPlayer(player);

    // Connect to Pusher
    const pusher = getPusherClient();
    const channel = pusher.subscribe(getGameChannel(roomCode));

    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
      // Broadcast join
      broadcast(TIC_TAC_TOE_EVENTS.PLAYER_JOINED, { player });
    });

    // Handle events
    channel.bind(TIC_TAC_TOE_EVENTS.PLAYER_JOINED, (data: { player: Player }) => {
      if (data.player.id !== pid) {
        addPlayer(data.player);
      }
    });

    channel.bind(TIC_TAC_TOE_EVENTS.PLAYER_LEFT, (data: { playerId: string }) => {
      removePlayer(data.playerId);
    });

    channel.bind(TIC_TAC_TOE_EVENTS.GAME_STARTED, () => {
      startGame();
    });

    channel.bind(TIC_TAC_TOE_EVENTS.GAME_STATE_UPDATE, (data: any) => {
      updateGameState(data);
    });

    channel.bind(TIC_TAC_TOE_EVENTS.CELL_CLAIMED, (data: { cellIndex: number; symbol: 'X' | 'O' }) => {
      // Update handled via state sync
    });

    channel.bind(TIC_TAC_TOE_EVENTS.QUESTION_ASKED, (data: { question: any }) => {
      updateGameState({ currentQuestion: data.question, status: 'answering' });
    });

    channel.bind(TIC_TAC_TOE_EVENTS.ANSWER_JUDGED, (data: { correct: boolean; newState: any }) => {
      updateGameState(data.newState);
    });

    channel.bind(TIC_TAC_TOE_EVENTS.ROUND_WON, (data: { winner: 'X' | 'O'; newState: any }) => {
      updateGameState(data.newState);
    });

    channel.bind(TIC_TAC_TOE_EVENTS.ROUND_DRAW, (data: { newState: any }) => {
      updateGameState(data.newState);
    });

    channel.bind(TIC_TAC_TOE_EVENTS.MATCH_WON, (data: { winner: Player; newState: any }) => {
      updateGameState(data.newState);
    });

    channel.bind(TIC_TAC_TOE_EVENTS.NEW_ROUND, (data: { newState: any }) => {
      updateGameState(data.newState);
    });

    return () => {
      broadcast(TIC_TAC_TOE_EVENTS.PLAYER_LEFT, { playerId: pid });
      channel.unbind_all();
      pusher.unsubscribe(getGameChannel(roomCode));
      fullReset();
    };
  }, [roomCode, router]);

  // Handle cell click
  const handleCellClick = (index: number) => {
    if (!isMyTurn || board[index] !== null || status !== 'playing') return;

    selectCell(index);

    // Get a question and broadcast it
    const question = getRandomQuestion(difficulty);
    if (question) {
      broadcast(TIC_TAC_TOE_EVENTS.QUESTION_ASKED, { question });
      updateGameState({ currentQuestion: question, status: 'answering' });
    }
  };

  // Host judges answer
  const handleJudgeAnswer = (correct: boolean) => {
    const { board, currentTurn, selectedCell, xWins, oWins, roundsToWin, players } = useGameStore.getState();

    const newBoard = [...board] as BoardState;
    let newXWins = xWins;
    let newOWins = oWins;
    let newStatus: any = 'playing';
    let newWinner: any = null;
    let newMatchWinner: any = null;
    let newTurn = currentTurn;

    if (correct && selectedCell !== null) {
      // Claim the cell
      newBoard[selectedCell] = currentTurn;

      // Check for win
      let roundWinner: 'X' | 'O' | 'draw' | null = null;
      for (const line of WIN_LINES) {
        const [a, b, c] = line;
        if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
          roundWinner = newBoard[a] as 'X' | 'O';
          break;
        }
      }

      // Check for draw
      if (!roundWinner && newBoard.every((cell) => cell !== null)) {
        roundWinner = 'draw';
      }

      if (roundWinner) {
        if (roundWinner === 'X') newXWins++;
        else if (roundWinner === 'O') newOWins++;

        newWinner = roundWinner;
        newStatus = 'round-over';

        // Check for match winner
        if (newXWins >= roundsToWin) {
          newMatchWinner = players.find((p) => p.symbol === 'X') || null;
          newStatus = 'finished';
        } else if (newOWins >= roundsToWin) {
          newMatchWinner = players.find((p) => p.symbol === 'O') || null;
          newStatus = 'finished';
        }
      } else {
        newTurn = currentTurn === 'X' ? 'O' : 'X';
      }
    } else {
      // Wrong answer, switch turns
      newTurn = currentTurn === 'X' ? 'O' : 'X';
    }

    const newState = {
      board: newBoard,
      currentTurn: newTurn,
      selectedCell: null,
      currentQuestion: null,
      status: newStatus,
      xWins: newXWins,
      oWins: newOWins,
      winner: newWinner,
      matchWinner: newMatchWinner,
    };

    updateGameState(newState);
    broadcast(TIC_TAC_TOE_EVENTS.ANSWER_JUDGED, { correct, newState });
  };

  // Start game
  const handleStartGame = () => {
    if (players.length < 2) return;

    // Assign symbols
    const updatedPlayers = players.map((p, i) => ({
      ...p,
      symbol: (i === 0 ? 'X' : 'O') as 'X' | 'O',
    }));

    const newState = {
      players: updatedPlayers,
      status: 'playing' as const,
      board: [...EMPTY_BOARD] as BoardState,
      currentTurn: 'X' as const,
      xWins: 0,
      oWins: 0,
      currentRound: 1,
    };

    updateGameState(newState);
    broadcast(TIC_TAC_TOE_EVENTS.GAME_STARTED, {});
    broadcast(TIC_TAC_TOE_EVENTS.GAME_STATE_UPDATE, newState);
  };

  // Start new round
  const handleNewRound = () => {
    const newState = {
      board: [...EMPTY_BOARD] as BoardState,
      currentTurn: 'X' as const,
      selectedCell: null,
      currentQuestion: null,
      winner: null,
      status: 'playing' as const,
      currentRound: currentRound + 1,
    };

    updateGameState(newState);
    broadcast(TIC_TAC_TOE_EVENTS.NEW_ROUND, { newState });
  };

  // Leave game
  const handleLeave = () => {
    router.push('/tic-tac-toe');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-900 to-orange-800 flex items-center justify-center">
        <LoadingSpinner message="Connecting..." />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-b from-orange-900 via-orange-800 to-orange-900 p-4">
        {/* Header */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={handleLeave}
              className="text-orange-300 hover:text-yellow-400 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Leave
            </button>
            <h1 className="text-2xl font-bold text-yellow-400">TIC TAC TOE</h1>
            <div className="text-orange-300 text-sm">
              Round {currentRound}
            </div>
          </div>
        </div>

        {/* Lobby */}
        {status === 'lobby' && (
          <div className="max-w-md mx-auto">
            <div className="bg-orange-950/80 rounded-2xl p-6 border border-orange-700/50 mb-6">
              <h2 className="text-xl font-bold text-yellow-400 mb-4">Waiting for Players</h2>

              <div className="space-y-3 mb-6">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-orange-900/50 rounded-lg p-3"
                  >
                    <span className="text-white">{p.name}</span>
                    {p.isHost && (
                      <span className="text-xs bg-yellow-500 text-orange-900 px-2 py-0.5 rounded">
                        HOST
                      </span>
                    )}
                  </div>
                ))}
                {players.length < 2 && (
                  <div className="flex items-center justify-center bg-orange-900/30 rounded-lg p-3 border-2 border-dashed border-orange-700">
                    <span className="text-orange-400">Waiting for opponent...</span>
                  </div>
                )}
              </div>

              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={players.length < 2}
                  className={`w-full py-3 rounded-lg font-bold text-lg transition-colors ${
                    players.length >= 2
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-orange-900'
                      : 'bg-orange-800 text-orange-500 cursor-not-allowed'
                  }`}
                >
                  {players.length < 2 ? 'Waiting for Opponent' : 'Start Game'}
                </button>
              )}

              {!isHost && (
                <p className="text-center text-orange-300">Waiting for host to start...</p>
              )}
            </div>

            <InvitePanel roomCode={roomCode} gameType="tic-tac-toe" />
          </div>
        )}

        {/* Game Board */}
        {(status === 'playing' || status === 'answering' || status === 'judging' || status === 'round-over') && (
          <div className="max-w-lg mx-auto">
            {/* Score Display */}
            <div className="flex justify-center gap-8 mb-6">
              <div className={`text-center px-6 py-3 rounded-xl ${
                currentTurn === 'X' && status === 'playing' ? 'bg-yellow-500 text-orange-900' : 'bg-orange-900/50 text-orange-200'
              }`}>
                <div className="text-3xl font-bold">X</div>
                <div className="text-sm">{players.find((p) => p.symbol === 'X')?.name || 'Player 1'}</div>
                <div className="text-2xl font-bold">{xWins}</div>
              </div>
              <div className="flex items-center text-orange-400 text-2xl">
                Best of {roundsToWin * 2 - 1}
              </div>
              <div className={`text-center px-6 py-3 rounded-xl ${
                currentTurn === 'O' && status === 'playing' ? 'bg-yellow-500 text-orange-900' : 'bg-orange-900/50 text-orange-200'
              }`}>
                <div className="text-3xl font-bold">O</div>
                <div className="text-sm">{players.find((p) => p.symbol === 'O')?.name || 'Player 2'}</div>
                <div className="text-2xl font-bold">{oWins}</div>
              </div>
            </div>

            {/* Turn Indicator */}
            {status === 'playing' && (
              <div className="text-center mb-4">
                <p className={`text-lg font-semibold ${isMyTurn ? 'text-yellow-400' : 'text-orange-300'}`}>
                  {isMyTurn ? "Your turn! Pick a square" : `${opponent?.name || 'Opponent'}'s turn`}
                </p>
              </div>
            )}

            {/* Board */}
            <div className="grid grid-cols-3 gap-2 mb-6 max-w-xs mx-auto">
              {board.map((cell, index) => (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  disabled={!isMyTurn || cell !== null || status !== 'playing'}
                  className={`aspect-square text-5xl font-bold rounded-xl transition-all ${
                    cell === 'X'
                      ? 'bg-blue-600 text-white'
                      : cell === 'O'
                      ? 'bg-red-600 text-white'
                      : isMyTurn && status === 'playing'
                      ? 'bg-orange-800 hover:bg-orange-700 cursor-pointer'
                      : 'bg-orange-900/50'
                  } ${selectedCell === index ? 'ring-4 ring-yellow-400' : ''}`}
                >
                  {cell}
                </button>
              ))}
            </div>

            {/* Round Over */}
            {status === 'round-over' && (
              <div className="bg-orange-950/90 rounded-2xl p-6 text-center border border-yellow-500">
                <h2 className="text-3xl font-bold text-yellow-400 mb-4">
                  {winner === 'draw' ? "It's a Draw!" : `${winner} Wins This Round!`}
                </h2>
                {isHost && (
                  <button
                    onClick={handleNewRound}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-orange-900 font-bold rounded-lg"
                  >
                    Next Round
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Question Modal */}
        {(status === 'answering' || status === 'judging') && currentQuestion && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-orange-950 rounded-2xl p-6 max-w-lg w-full border-4 border-yellow-500">
              <div className="text-center mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-green-600 text-white'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-red-600 text-white'
                }`}>
                  {currentQuestion.difficulty.toUpperCase()}
                </span>
                <span className="ml-2 text-orange-400 text-sm">{currentQuestion.category}</span>
              </div>

              <h3 className="text-xl font-bold text-white text-center mb-6">
                {currentQuestion.question}
              </h3>

              {/* Show answer to host for judging */}
              {isHost && status === 'judging' && (
                <div className="bg-green-900/50 rounded-lg p-4 mb-6 border border-green-600">
                  <p className="text-green-400 text-sm mb-1">Correct Answer:</p>
                  <p className="text-white font-semibold">{currentQuestion.answer}</p>
                </div>
              )}

              {/* Waiting message for non-current player */}
              {!isMyTurn && status === 'answering' && (
                <div className="text-center text-orange-300">
                  Waiting for {players.find((p) => p.symbol === currentTurn)?.name} to answer...
                </div>
              )}

              {/* Answer prompt for current player */}
              {isMyTurn && status === 'answering' && (
                <div className="text-center">
                  <p className="text-orange-300 mb-4">Say your answer out loud!</p>
                  <p className="text-orange-400 text-sm">The host will judge if you're correct</p>
                </div>
              )}

              {/* Host judging controls */}
              {isHost && status === 'answering' && (
                <div className="mt-6">
                  <p className="text-center text-orange-300 mb-4">
                    Did {players.find((p) => p.symbol === currentTurn)?.name} answer correctly?
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => handleJudgeAnswer(true)}
                      className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg"
                    >
                      Correct!
                    </button>
                    <button
                      onClick={() => handleJudgeAnswer(false)}
                      className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg"
                    >
                      Wrong
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Match Over */}
        {status === 'finished' && matchWinner && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-orange-950 rounded-2xl p-8 max-w-md w-full border-4 border-yellow-500 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                {matchWinner.name} Wins!
              </h2>
              <p className="text-orange-300 mb-6">
                Final Score: {xWins} - {oWins}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleLeave}
                  className="px-6 py-3 bg-orange-700 hover:bg-orange-600 text-white font-semibold rounded-lg"
                >
                  Back to Lobby
                </button>
                {isHost && (
                  <button
                    onClick={() => {
                      // Get current players with their existing symbols
                      const currentPlayers = useGameStore.getState().players;
                      const newState = {
                        status: 'playing' as const,
                        board: [...EMPTY_BOARD] as BoardState,
                        currentTurn: 'X' as const,
                        xWins: 0,
                        oWins: 0,
                        currentRound: 1,
                        winner: null,
                        matchWinner: null,
                        selectedCell: null,
                        currentQuestion: null,
                        playerAnswer: null,
                        answerCorrect: null,
                        players: currentPlayers, // Preserve players with their symbols
                      };
                      updateGameState(newState);
                      broadcast(TIC_TAC_TOE_EVENTS.GAME_STATE_UPDATE, newState);
                    }}
                    className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-orange-900 font-bold rounded-lg"
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
