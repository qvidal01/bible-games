// Bible Tic Tac Toe - Game Types

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  symbol: 'X' | 'O' | null;
  score: number;
  connectedAt: number;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type CellValue = 'X' | 'O' | null;

export type BoardState = [
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue,
  CellValue, CellValue, CellValue
];

export type GameStatus =
  | 'lobby'           // Waiting for players
  | 'playing'         // Game in progress
  | 'question'        // Question being asked
  | 'answering'       // Player is answering
  | 'judging'         // Host is judging the answer
  | 'round-over'      // Round finished (someone won or draw)
  | 'finished';       // Match finished

export interface GameState {
  roomCode: string;
  status: GameStatus;
  players: Player[];
  hostId: string;

  // Board state
  board: BoardState;
  currentTurn: 'X' | 'O';
  selectedCell: number | null;

  // Question state
  currentQuestion: TriviaQuestion | null;
  playerAnswer: string | null;
  answerCorrect: boolean | null;

  // Scoring
  roundsToWin: number;        // Best of 3, 5, etc.
  xWins: number;
  oWins: number;
  currentRound: number;

  // Settings
  timerDuration: number;      // Seconds to answer
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  soundEnabled: boolean;

  // Match result
  winner: 'X' | 'O' | 'draw' | null;
  matchWinner: Player | null;
}

// Win conditions - indices of winning lines
export const WIN_LINES = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Middle column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
];

// Game events
export type GameEvent =
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'GAME_STARTED' }
  | { type: 'CELL_SELECTED'; cellIndex: number; playerId: string }
  | { type: 'QUESTION_ASKED'; question: TriviaQuestion }
  | { type: 'ANSWER_SUBMITTED'; answer: string }
  | { type: 'ANSWER_JUDGED'; correct: boolean }
  | { type: 'CELL_CLAIMED'; cellIndex: number; symbol: 'X' | 'O' }
  | { type: 'TURN_CHANGED'; newTurn: 'X' | 'O' }
  | { type: 'ROUND_WON'; winner: 'X' | 'O'; winningLine: number[] }
  | { type: 'ROUND_DRAW' }
  | { type: 'MATCH_WON'; winner: Player }
  | { type: 'NEW_ROUND' }
  | { type: 'GAME_RESET' };

// Initial board state
export const EMPTY_BOARD: BoardState = [
  null, null, null,
  null, null, null,
  null, null, null,
];
