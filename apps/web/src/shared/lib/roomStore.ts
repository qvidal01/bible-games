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
  // Inactivity tracking
  warningLevel: 0 | 1 | 2;  // 0=none, 1=first warning sent, 2=final warning sent
}

// In-memory store (replace with Redis for production)
const rooms = new Map<string, ServerRoom>();

// Room TTL: 90 minutes max session length
const ROOM_TTL = 90 * 60 * 1000;

// Inactivity timeouts
const INACTIVITY_WARNING_1 = 10 * 60 * 1000;  // First warning at 10 min
const INACTIVITY_WARNING_2 = 20 * 60 * 1000;  // Second warning at 20 min
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;    // End game at 30 min

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
    warningLevel: 0,
  };
  rooms.set(code, room);
  return room;
}

// Reset activity timer (call this on any user action)
export function resetActivity(code: string): void {
  const room = rooms.get(code);
  if (room) {
    room.lastActivity = Date.now();
    room.warningLevel = 0;  // Reset warnings on activity
    rooms.set(code, room);
  }
}

// Check inactivity status for a room
export type InactivityStatus = 'active' | 'warning1' | 'warning2' | 'timeout' | 'expired';

export function checkInactivity(code: string): { status: InactivityStatus; minutesInactive: number } {
  const room = rooms.get(code);
  if (!room) return { status: 'expired', minutesInactive: 0 };

  const now = Date.now();
  const inactiveTime = now - room.lastActivity;
  const minutesInactive = Math.floor(inactiveTime / 60000);

  // Check session expiration (90 min total)
  if (now > room.expiresAt) {
    return { status: 'expired', minutesInactive };
  }

  // Check inactivity thresholds
  if (inactiveTime >= INACTIVITY_TIMEOUT) {
    return { status: 'timeout', minutesInactive };
  }
  if (inactiveTime >= INACTIVITY_WARNING_2) {
    return { status: 'warning2', minutesInactive };
  }
  if (inactiveTime >= INACTIVITY_WARNING_1) {
    return { status: 'warning1', minutesInactive };
  }

  return { status: 'active', minutesInactive };
}

// Get rooms that need warnings or should be ended
export function getRoomsNeedingAction(): {
  needsWarning1: ServerRoom[];
  needsWarning2: ServerRoom[];
  needsTimeout: ServerRoom[];
  needsExpire: ServerRoom[];
} {
  const now = Date.now();
  const result = {
    needsWarning1: [] as ServerRoom[],
    needsWarning2: [] as ServerRoom[],
    needsTimeout: [] as ServerRoom[],
    needsExpire: [] as ServerRoom[],
  };

  rooms.forEach((room) => {
    const inactiveTime = now - room.lastActivity;

    // Check session expiration
    if (now > room.expiresAt) {
      result.needsExpire.push(room);
      return;
    }

    // Check inactivity (only for active games, not lobby)
    if (room.status === 'playing') {
      if (inactiveTime >= INACTIVITY_TIMEOUT) {
        result.needsTimeout.push(room);
      } else if (inactiveTime >= INACTIVITY_WARNING_2 && room.warningLevel < 2) {
        result.needsWarning2.push(room);
      } else if (inactiveTime >= INACTIVITY_WARNING_1 && room.warningLevel < 1) {
        result.needsWarning1.push(room);
      }
    }
  });

  return result;
}

// Mark warning as sent
export function markWarningSent(code: string, level: 1 | 2): void {
  const room = rooms.get(code);
  if (room) {
    room.warningLevel = level;
    rooms.set(code, room);
  }
}

// Export timeout constants for use in other files
export const TIMEOUTS = {
  ROOM_TTL,
  INACTIVITY_WARNING_1,
  INACTIVITY_WARNING_2,
  INACTIVITY_TIMEOUT,
};

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
