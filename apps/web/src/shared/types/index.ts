// Shared types for all games

export type GameType =
  | 'jeopardy'
  | 'family-feud'
  | 'tic-tac-toe'
  | 'memory-match'
  | 'go-fish'
  | 'kids-trivia';

// Base player type - games extend this
export interface BasePlayer {
  id: string;
  name: string;
  isHost: boolean;
  isSpectator?: boolean;
  connectedAt?: number;
}

// Base team type - games extend this
export interface BaseTeam {
  id: string;
  name: string;
  color: string;
  score: number;
  playerIds: string[];
}

// Room info stored on server
export interface Room {
  code: string;
  gameType: GameType;
  roomName?: string;
  hostId: string;
  hostName: string;
  description?: string;
  zoomLink?: string;
  zoomPassword?: string;
  isPrivate: boolean;
  maxPlayers: number;
  playerCount: number;
  status: 'lobby' | 'playing' | 'finished';
  createdAt: number;
  lastActivity: number;
}

// Public room for browsing
export interface PublicRoom {
  code: string;
  gameType: GameType;
  roomName: string;
  hostName: string;
  description?: string;
  playerCount: number;
  maxPlayers: number;
  hasZoomLink: boolean;
  createdAt: number;
}

// Buzz event
export interface BuzzEvent {
  playerId: string;
  playerName: string;
  time: number;
}

// Common game statuses
export type BaseGameStatus = 'lobby' | 'playing' | 'finished';

// Host management
export interface HostState {
  hostId: string;
  lastHeartbeat: number;
  isDisconnected: boolean;
}
