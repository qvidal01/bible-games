// Server-side room storage (in-memory for development, use Redis/database for production)

export interface ServerRoom {
  code: string;
  hostId: string;
  hostName: string;
  roomName?: string;           // Custom room name (e.g., "Smith Family Game Night")
  zoomLink?: string;           // Optional Zoom/Meet link for the game
  zoomPassword?: string;       // Optional Zoom password
  description?: string;        // Optional room description
  isPrivate: boolean;          // Private rooms don't show in public list
  createdAt: number;
  expiresAt: number;
  playerCount: number;
  status: 'lobby' | 'category-select' | 'playing' | 'finished';
  isTeamMode: boolean;
  maxPlayers: number;
}

// In-memory store (replace with Redis for production)
const rooms = new Map<string, ServerRoom>();

// Room TTL: 4 hours
const ROOM_TTL = 4 * 60 * 60 * 1000;

// Max players per room
const MAX_PLAYERS = 10;

// Room creation options
export interface CreateRoomOptions {
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
    hostId,
    hostName,
    roomName: options.roomName || `${hostName}'s Game`,
    zoomLink: options.zoomLink,
    zoomPassword: options.zoomPassword,
    description: options.description,
    isPrivate: options.isPrivate ?? false,
    createdAt: now,
    expiresAt: now + ROOM_TTL,
    playerCount: 1,
    status: 'lobby',
    isTeamMode: false,
    maxPlayers: options.maxPlayers || MAX_PLAYERS,
  };
  rooms.set(code, room);
  return room;
}

// Get public rooms (for room browser)
export function getPublicRooms(): ServerRoom[] {
  const now = Date.now();
  const publicRooms: ServerRoom[] = [];

  rooms.forEach((room, code) => {
    if (now <= room.expiresAt && !room.isPrivate && room.status === 'lobby') {
      publicRooms.push(room);
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

  const updatedRoom = { ...room, ...updates };
  rooms.set(code, updatedRoom);
  return updatedRoom;
}

// Join room (increment player count)
export function joinRoom(code: string): { success: boolean; error?: string } {
  const room = getRoom(code);
  if (!room) {
    return { success: false, error: 'Room not found' };
  }

  if (room.playerCount >= room.maxPlayers) {
    return { success: false, error: 'Room is full' };
  }

  if (room.status !== 'lobby') {
    return { success: false, error: 'Game already in progress' };
  }

  room.playerCount++;
  rooms.set(code, room);
  return { success: true };
}

// Leave room (decrement player count)
export function leaveRoom(code: string, playerId: string): void {
  const room = getRoom(code);
  if (!room) return;

  room.playerCount = Math.max(0, room.playerCount - 1);

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
