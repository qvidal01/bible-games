// Bible Go Fish - Game Types

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  hand: Card[];
  sets: CardSet[];
  connectedAt: number;
}

export interface Card {
  id: string;
  category: string;
  character: string;
  emoji: string;
}

export interface CardSet {
  category: string;
  cards: Card[];
  completedBy: string;
}

export interface CardCategory {
  name: string;
  emoji: string;
  characters: {
    name: string;
    emoji: string;
  }[];
}

export type GameStatus =
  | 'lobby'
  | 'playing'
  | 'asking'      // Player is asking for a card
  | 'responding'  // Other player responding
  | 'fishing'     // Player drawing from deck
  | 'finished';

export interface GameState {
  roomCode: string;
  status: GameStatus;
  players: Player[];
  hostId: string;
  deck: Card[];
  currentPlayerIndex: number;
  lastAction: string | null;
  askedCategory: string | null;
  askedPlayerId: string | null;
  winner: Player | null;
}

// Go Fish works best with 2-4 players
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 4;
export const CARDS_PER_SET = 4;
export const INITIAL_HAND_SIZE = 7; // 5 if 4 players
