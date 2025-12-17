// Bible Tic Tac Toe - Zustand Game Store

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  GameState,
  GameStatus,
  Player,
  BoardState,
  TriviaQuestion,
  EMPTY_BOARD,
  WIN_LINES,
} from '../types/game';
import { getRandomQuestion } from '../data/questions';

interface GameStore extends GameState {
  // Room management
  setRoomCode: (code: string) => void;
  setHostId: (id: string) => void;

  // Player management
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  assignSymbols: () => void;
  updatePlayerScore: (playerId: string, score: number) => void;

  // Game flow
  setStatus: (status: GameStatus) => void;
  startGame: () => void;
  selectCell: (cellIndex: number) => void;
  askQuestion: () => void;
  submitAnswer: (answer: string) => void;
  judgeAnswer: (correct: boolean) => void;
  changeTurn: () => void;
  checkWinCondition: () => 'X' | 'O' | 'draw' | null;
  endRound: (winner: 'X' | 'O' | 'draw') => void;
  startNewRound: () => void;
  endMatch: () => void;

  // Settings
  setRoundsToWin: (rounds: number) => void;
  setTimerDuration: (duration: number) => void;
  setDifficulty: (difficulty: 'easy' | 'medium' | 'hard' | 'mixed') => void;
  setSoundEnabled: (enabled: boolean) => void;

  // State sync
  updateGameState: (state: Partial<GameState>) => void;
  fullReset: () => void;

  // Internal
  usedQuestionIds: Set<string>;
}

const initialState: Omit<GameState, 'usedQuestionIds'> = {
  roomCode: '',
  status: 'lobby',
  players: [],
  hostId: '',
  board: [...EMPTY_BOARD],
  currentTurn: 'X',
  selectedCell: null,
  currentQuestion: null,
  playerAnswer: null,
  answerCorrect: null,
  roundsToWin: 2, // Best of 3 by default
  xWins: 0,
  oWins: 0,
  currentRound: 1,
  timerDuration: 30,
  difficulty: 'mixed',
  soundEnabled: true,
  winner: null,
  matchWinner: null,
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    usedQuestionIds: new Set(),

    // Room management
    setRoomCode: (code) => set({ roomCode: code }),
    setHostId: (id) => set({ hostId: id }),

    // Player management
    addPlayer: (player) =>
      set((state) => ({
        players: [...state.players.filter((p) => p.id !== player.id), player],
      })),

    removePlayer: (playerId) =>
      set((state) => ({
        players: state.players.filter((p) => p.id !== playerId),
      })),

    assignSymbols: () =>
      set((state) => {
        const players = [...state.players];
        if (players.length >= 2) {
          // Host is X, second player is O
          const hostIndex = players.findIndex((p) => p.isHost);
          if (hostIndex !== -1) {
            players[hostIndex] = { ...players[hostIndex], symbol: 'X' };
          }
          const opponentIndex = players.findIndex((p) => !p.isHost);
          if (opponentIndex !== -1) {
            players[opponentIndex] = { ...players[opponentIndex], symbol: 'O' };
          }
        }
        return { players };
      }),

    updatePlayerScore: (playerId, score) =>
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, score } : p
        ),
      })),

    // Game flow
    setStatus: (status) => set({ status }),

    startGame: () => {
      const { assignSymbols } = get();
      assignSymbols();
      set({
        status: 'playing',
        board: [...EMPTY_BOARD],
        currentTurn: 'X',
        xWins: 0,
        oWins: 0,
        currentRound: 1,
        winner: null,
        matchWinner: null,
      });
    },

    selectCell: (cellIndex) => {
      const { board, status } = get();
      if (status !== 'playing' || board[cellIndex] !== null) return;
      set({ selectedCell: cellIndex, status: 'question' });
    },

    askQuestion: () => {
      const { difficulty, usedQuestionIds } = get();
      const question = getRandomQuestion(difficulty, usedQuestionIds);
      if (question) {
        usedQuestionIds.add(question.id);
        set({
          currentQuestion: question,
          status: 'answering',
          playerAnswer: null,
          answerCorrect: null,
        });
      }
    },

    submitAnswer: (answer) => {
      set({ playerAnswer: answer, status: 'judging' });
    },

    judgeAnswer: (correct) => {
      const { selectedCell, currentTurn, board } = get();
      set({ answerCorrect: correct });

      if (correct && selectedCell !== null) {
        // Claim the cell
        const newBoard = [...board] as BoardState;
        newBoard[selectedCell] = currentTurn;
        set({ board: newBoard });

        // Check for win
        const { checkWinCondition, endRound, changeTurn } = get();
        const result = checkWinCondition();
        if (result) {
          endRound(result);
        } else {
          changeTurn();
          set({ status: 'playing', selectedCell: null, currentQuestion: null });
        }
      } else {
        // Wrong answer, switch turns
        const { changeTurn } = get();
        changeTurn();
        set({ status: 'playing', selectedCell: null, currentQuestion: null });
      }
    },

    changeTurn: () => {
      set((state) => ({
        currentTurn: state.currentTurn === 'X' ? 'O' : 'X',
      }));
    },

    checkWinCondition: () => {
      const { board } = get();

      // Check for winner
      for (const line of WIN_LINES) {
        const [a, b, c] = line;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return board[a] as 'X' | 'O';
        }
      }

      // Check for draw (all cells filled)
      if (board.every((cell) => cell !== null)) {
        return 'draw';
      }

      return null;
    },

    endRound: (winner) => {
      const { xWins, oWins, roundsToWin, players } = get();

      let newXWins = xWins;
      let newOWins = oWins;

      if (winner === 'X') newXWins++;
      else if (winner === 'O') newOWins++;

      set({
        winner,
        xWins: newXWins,
        oWins: newOWins,
        status: 'round-over',
      });

      // Check if match is won
      if (newXWins >= roundsToWin) {
        const matchWinner = players.find((p) => p.symbol === 'X') || null;
        set({ matchWinner, status: 'finished' });
      } else if (newOWins >= roundsToWin) {
        const matchWinner = players.find((p) => p.symbol === 'O') || null;
        set({ matchWinner, status: 'finished' });
      }
    },

    startNewRound: () => {
      set((state) => ({
        board: [...EMPTY_BOARD],
        currentTurn: 'X',
        selectedCell: null,
        currentQuestion: null,
        playerAnswer: null,
        answerCorrect: null,
        winner: null,
        currentRound: state.currentRound + 1,
        status: 'playing',
      }));
    },

    endMatch: () => {
      set({ status: 'finished' });
    },

    // Settings
    setRoundsToWin: (rounds) => set({ roundsToWin: rounds }),
    setTimerDuration: (duration) => set({ timerDuration: duration }),
    setDifficulty: (difficulty) => set({ difficulty }),
    setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),

    // State sync
    updateGameState: (newState) => set((state) => ({ ...state, ...newState })),

    fullReset: () =>
      set({
        ...initialState,
        usedQuestionIds: new Set(),
      }),
  }))
);

// Selective subscription hooks for performance
export const useGameStatus = () => useGameStore((state) => state.status);
export const usePlayers = () => useGameStore((state) => state.players);
export const useBoard = () => useGameStore((state) => state.board);
export const useCurrentTurn = () => useGameStore((state) => state.currentTurn);
export const useCurrentQuestion = () => useGameStore((state) => state.currentQuestion);
export const useScores = () =>
  useGameStore((state) => ({ xWins: state.xWins, oWins: state.oWins }));
export const useMatchWinner = () => useGameStore((state) => state.matchWinner);
