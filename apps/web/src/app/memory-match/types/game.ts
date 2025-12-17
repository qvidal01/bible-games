// Bible Memory Match - Game Types
// A kids-friendly matching game with Bible characters

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number; // Number of pairs found
  connectedAt: number;
}

export interface BibleCharacter {
  id: string;
  name: string;
  emoji: string;       // Emoji representation
  description: string; // Short description for learning
  color: string;       // Background color for the card
}

export interface Card {
  id: string;
  characterId: string;
  isFlipped: boolean;
  isMatched: boolean;
  matchedBy?: string;  // Player ID who matched it
}

export type GameStatus =
  | 'lobby'           // Waiting for players
  | 'playing'         // Game in progress
  | 'flipping'        // Card flip animation in progress
  | 'checking'        // Checking if two cards match
  | 'finished';       // Game over

export type GridSize = '4x4' | '4x6' | '6x6';

export interface GameState {
  roomCode: string;
  status: GameStatus;
  players: Player[];
  hostId: string;

  // Board state
  cards: Card[];
  gridSize: GridSize;

  // Turn state
  currentPlayerIndex: number;
  firstCard: number | null;   // Index of first flipped card
  secondCard: number | null;  // Index of second flipped card

  // Settings
  soundEnabled: boolean;
  showHints: boolean;  // Show character names on cards (easier for young kids)

  // Results
  winner: Player | null;
}

// Grid size configurations
export const GRID_CONFIGS: Record<GridSize, { rows: number; cols: number; pairs: number }> = {
  '4x4': { rows: 4, cols: 4, pairs: 8 },
  '4x6': { rows: 4, cols: 6, pairs: 12 },
  '6x6': { rows: 6, cols: 6, pairs: 18 },
};

// Game events
export type GameEvent =
  | { type: 'PLAYER_JOINED'; player: Player }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'GAME_STARTED'; cards: Card[] }
  | { type: 'CARD_FLIPPED'; cardIndex: number; playerId: string }
  | { type: 'MATCH_FOUND'; cardIndices: [number, number]; playerId: string }
  | { type: 'NO_MATCH'; cardIndices: [number, number] }
  | { type: 'TURN_CHANGED'; playerIndex: number }
  | { type: 'GAME_OVER'; winner: Player };
