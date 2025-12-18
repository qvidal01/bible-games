export type KidsTriviaDifficulty = 'easy' | 'medium' | 'hard';

export type KidsTriviaStatus = 'lobby' | 'playing' | 'reveal' | 'finished';

export type KidsTriviaPlayer = {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  connectedAt?: number;
};

export type KidsTriviaSettings = {
  difficulty: KidsTriviaDifficulty;
  timerSeconds: number;
  hintDelaySeconds: number;
  autoShowHint: boolean;
  hostRevealOnly: boolean;
  points: Record<KidsTriviaDifficulty, number>;
  maxRounds: number;
};

export type KidsTriviaRound = {
  index: number;
  questionId: string;
  startedAt: number;
  closedAt: number | null;
  revealedAt: number | null;
  winnerPlayerId: string | null;
  answersByPlayerId: Record<string, string>;
};

export type KidsTriviaGameState = {
  roomCode: string;
  hostId: string;
  status: KidsTriviaStatus;
  players: KidsTriviaPlayer[];
  settings: KidsTriviaSettings;
  round: KidsTriviaRound | null;
  usedQuestionIds: string[];
};
