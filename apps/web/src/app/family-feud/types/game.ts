// Game Types for Bible Family Feud

export interface Player {
  id: string;
  name: string;
  teamId: 'red' | 'blue' | null;
  isHost: boolean;
  isCaptain: boolean;
}

export interface Team {
  id: 'red' | 'blue';
  name: string;
  score: number;
  players: string[]; // player IDs
  strikes: number;
  color: 'red' | 'blue';
}

export interface SurveyAnswer {
  id: string;
  text: string;
  points: number;
  revealed: boolean;
  rank: number; // 1 = top answer
}

export interface SurveyQuestion {
  id: string;
  question: string;
  category: string;
  answers: SurveyAnswer[];
  totalPoints: number;
  isPlayed: boolean;
}

export interface GameState {
  roomCode: string;
  status: 'lobby' | 'team-setup' | 'face-off' | 'playing' | 'steal' | 'round-end' | 'finished';
  players: Player[];
  teams: {
    red: Team;
    blue: Team;
  };
  hostId: string;
  currentQuestion: SurveyQuestion | null;
  questionIndex: number;
  questions: SurveyQuestion[];
  controllingTeam: 'red' | 'blue' | null;
  faceOffWinner: 'red' | 'blue' | null;
  currentAnsweringTeam: 'red' | 'blue' | null;
  roundPoints: number; // accumulated points for current round
  round: number;
  maxRounds: number;
  faceOffBuzzed: { teamId: 'red' | 'blue'; time: number } | null;
  lastRevealedAnswer: SurveyAnswer | null;
}

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

// Pusher Events
export type GameEvent =
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'TEAM_JOINED'; playerId: string; teamId: 'red' | 'blue' }
  | { type: 'GAME_STARTED'; questions: SurveyQuestion[] }
  | { type: 'FACE_OFF_BUZZ'; teamId: 'red' | 'blue'; time: number }
  | { type: 'FACE_OFF_RESULT'; winner: 'red' | 'blue' }
  | { type: 'PLAY_OR_PASS'; decision: 'play' | 'pass' }
  | { type: 'ANSWER_REVEALED'; answerId: string; points: number }
  | { type: 'STRIKE'; teamId: 'red' | 'blue'; strikeCount: number }
  | { type: 'STEAL_ATTEMPT'; teamId: 'red' | 'blue' }
  | { type: 'STEAL_RESULT'; success: boolean; points: number }
  | { type: 'ROUND_END'; redScore: number; blueScore: number }
  | { type: 'GAME_STATE_UPDATE'; state: Partial<GameState> }
  | { type: 'NEXT_QUESTION' }
  | { type: 'GAME_OVER'; winner: 'red' | 'blue' | 'tie' };
