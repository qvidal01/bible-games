// Game Types for Bible Jeopardy

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isSpectator: boolean;
  teamId?: string;
  buzzTime?: number; // timestamp when they buzzed
  connectedAt: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  playerIds: string[];
  score: number;
}

export interface Question {
  id: string;
  category: string;
  value: number;
  question: string;
  answer: string;
  isAnswered: boolean;
  isDailyDouble?: boolean;
  answeredBy?: string; // player ID who answered correctly
}

export interface Category {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

export interface GameBoard {
  categories: Category[];
}

export interface FinalJeopardyState {
  category: string;
  question: string;
  answer: string;
  wagers: Record<string, number>; // playerId -> wager amount
  answers: Record<string, string>; // playerId -> their answer
  revealed: boolean;
  showAnswers: boolean;
}

export interface DailyDoubleState {
  question: Question;
  playerId: string;
  wager: number | null;
  maxWager: number;
  answered: boolean;
}

export type GameStatus =
  | 'lobby'
  | 'category-select'
  | 'playing'
  | 'question'
  | 'buzzing'
  | 'daily-double'
  | 'final-jeopardy-wager'
  | 'final-jeopardy-question'
  | 'final-jeopardy-reveal'
  | 'reveal'
  | 'finished';

export interface GameState {
  roomCode: string;
  status: GameStatus;
  players: Player[];
  hostId: string;
  board: GameBoard | null;
  currentQuestion: Question | null;
  buzzedPlayer: Player | null;
  buzzOrder: { playerId: string; time: number }[];
  wrongAnswerers: string[]; // Player IDs who answered wrong on current question
  round: 1 | 2; // 1 = Jeopardy, 2 = Double Jeopardy
  selectedCategories: string[];
  // Team mode
  isTeamMode: boolean;
  teams: Team[];
  // Daily Double
  dailyDoubleState: DailyDoubleState | null;
  // Final Jeopardy
  finalJeopardy: FinalJeopardyState | null;
  // Settings
  timerDuration: number; // seconds for answer timer
  soundEnabled: boolean;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

// Player statistics for tracking
export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  questionsCorrect: number;
  questionsWrong: number;
  totalEarnings: number;
  fastestBuzz: number;
  favoriteCategory: string;
  dailyDoublesWon: number;
}

// Pusher Events
export type GameEvent =
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'GAME_STARTED'; board: GameBoard }
  | { type: 'QUESTION_SELECTED'; question: Question }
  | { type: 'PLAYER_BUZZED'; playerId: string; time: number }
  | { type: 'ANSWER_JUDGED'; playerId: string; correct: boolean; newScore: number }
  | { type: 'QUESTION_CLOSED'; questionId: string }
  | { type: 'GAME_STATE_UPDATE'; state: Partial<GameState> }
  | { type: 'BUZZ_RESET' }
  | { type: 'REVEAL_ANSWER' }
  | { type: 'DAILY_DOUBLE'; question: Question; playerId: string }
  | { type: 'DAILY_DOUBLE_WAGER'; playerId: string; wager: number }
  | { type: 'FINAL_JEOPARDY_START'; category: string; question: string }
  | { type: 'FINAL_JEOPARDY_WAGER'; playerId: string; wager: number }
  | { type: 'FINAL_JEOPARDY_ANSWER'; playerId: string }
  | { type: 'FINAL_JEOPARDY_REVEAL' }
  | { type: 'ROUND_CHANGE'; round: 1 | 2 }
  | { type: 'TEAM_CREATED'; team: Team }
  | { type: 'PLAYER_JOINED_TEAM'; playerId: string; teamId: string };

// Sound effect names
export type SoundName =
  | 'buzz'
  | 'correct'
  | 'wrong'
  | 'select'
  | 'timer'
  | 'dailyDouble'
  | 'finalJeopardy'
  | 'gameOver';
