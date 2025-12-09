// Server-side room storage (in-memory for development, use Redis/database for production)
import { GameType } from '@shared/types';

export interface ServerRoom {
  code: string;
  gameType: GameType;
  hostId: string;
  hostName: string;
  roomName?: string;
  zoomLink?: string;
  zoomPassword?: string;
  description?: string;
  isPrivate: boolean;
  createdAt: number;
  expiresAt: number;
  lastActivity: number;
  playerCount: number;
  status: 'lobby' | 'playing' | 'finished';
  maxPlayers: number;
}

// In-memory store (replace with Redis for production)
const rooms = new Map<string, ServerRoom>();

// Room TTL: 4 hours
const ROOM_TTL = 4 * 60 * 60 * 1000;

// Max players per room
const DEFAULT_MAX_PLAYERS = 10;

// Room creation options
export interface CreateRoomOptions {
  gameType?: GameType;
  roomName?: string;
  zoomLink?: string;
  zoomPassword?: string;
  description?: string;
  isPrivate?: boolean;
  maxPlayers?: number;
}

// Create a new room
export function createRoom(
  code: string,
  hostId: string,
  hostName: string,
  options: CreateRoomOptions = {}
): ServerRoom {
  const now = Date.now();
  const room: ServerRoom = {
    code,
    gameType: options.gameType || 'jeopardy',
    hostId,
    hostName,
    roomName: options.roomName || `${hostName}'s Game`,
    zoomLink: options.zoomLink,
    zoomPassword: options.zoomPassword,
    description: options.description,
    isPrivate: options.isPrivate ?? false,
    createdAt: now,
    expiresAt: now + ROOM_TTL,
    lastActivity: now,
    playerCount: 1,
    status: 'lobby',
    maxPlayers: options.maxPlayers || DEFAULT_MAX_PLAYERS,
  };
  rooms.set(code, room);
  return room;
}

// Get public rooms (for room browser)
export function getPublicRooms(gameType?: GameType): ServerRoom[] {
  const now = Date.now();
  const publicRooms: ServerRoom[] = [];

  rooms.forEach((room, code) => {
    if (now <= room.expiresAt && !room.isPrivate && room.status === 'lobby') {
      if (!gameType || room.gameType === gameType) {
        publicRooms.push(room);
      }
    } else if (now > room.expiresAt) {
      rooms.delete(code);
    }
  });

  // Sort by creation time (newest first)
  return publicRooms.sort((a, b) => b.createdAt - a.createdAt);
}

// Get room by code
export function getRoom(code: string): ServerRoom | null {
  const room = rooms.get(code);
  if (!room) return null;

  // Check if room has expired
  if (Date.now() > room.expiresAt) {
    rooms.delete(code);
    return null;
  }

  return room;
}

// Check if room exists
export function roomExists(code: string): boolean {
  return getRoom(code) !== null;
}

// Update room
export function updateRoom(code: string, updates: Partial<ServerRoom>): ServerRoom | null {
  const room = getRoom(code);
  if (!room) return null;

  const updatedRoom = { ...room, ...updates, lastActivity: Date.now() };
  rooms.set(code, updatedRoom);
  return updatedRoom;
}

// Join room (increment player count)
export function joinRoom(code: string): { success: boolean; error?: string; room?: ServerRoom } {
  const room = getRoom(code);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.playerCount >= room.maxPlayers) {
    return { success: false, error: 'Room is full' };
  }

  room.playerCount++;
  room.lastActivity = Date.now();
  rooms.set(code, room);
  return { success: true, room };
}

// Leave room (decrement player count)
export function leaveRoom(code: string, playerId: string): void {
  const room = getRoom(code);
  if (!room) return;

  room.playerCount = Math.max(0, room.playerCount - 1);
  room.lastActivity = Date.now();

  // Delete room if empty
  if (room.playerCount === 0) {
    rooms.delete(code);
    return;
  }

  rooms.set(code, room);
}

// Delete room
export function deleteRoom(code: string): void {
  rooms.delete(code);
}

// Get all active rooms (for admin/debugging)
export function getAllRooms(): ServerRoom[] {
  const now = Date.now();
  const activeRooms: ServerRoom[] = [];

  rooms.forEach((room, code) => {
    if (now <= room.expiresAt) {
      activeRooms.push(room);
    } else {
      rooms.delete(code);
    }
  });

  return activeRooms;
}

// Clean up expired rooms
export function cleanupExpiredRooms(): number {
  const now = Date.now();
  let deletedCount = 0;

  rooms.forEach((room, code) => {
    if (now > room.expiresAt) {
      rooms.delete(code);
      deletedCount++;
    }
  });

  return deletedCount;
}

// Run cleanup every 30 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRooms, 30 * 60 * 1000);
}
