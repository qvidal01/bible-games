// Server-side connection tracking
// Tracks active Pusher connections to enforce limits

interface ConnectionEntry {
  odId: string;
  odRoomCode: string;
  connectedAt: number;
  lastPing: number;
}

// In-memory store (use Redis for production multi-instance)
const connections = new Map<string, ConnectionEntry>();

// Configuration
export const CONNECTION_LIMITS = {
  MAX_TOTAL_CONNECTIONS: 90, // Leave buffer for Pusher's 100 limit
  MAX_PER_ROOM: 15,
  PING_TIMEOUT: 60000, // 60 seconds without ping = disconnected
  WARNING_THRESHOLD: 80, // Show warning at 80 connections
};

// Clean up stale connections periodically
function cleanupStaleConnections() {
  const now = Date.now();
  const staleIds: string[] = [];

  connections.forEach((entry, odId) => {
    if (now - entry.lastPing > CONNECTION_LIMITS.PING_TIMEOUT) {
      staleIds.push(odId);
    }
  });

  staleIds.forEach(odId => connections.delete(odId));

  return staleIds.length;
}

// Run cleanup every 30 seconds
setInterval(cleanupStaleConnections, 30000);

// Get current connection stats
export function getConnectionStats() {
  cleanupStaleConnections();

  const totalConnections = connections.size;
  const roomCounts = new Map<string, number>();

  connections.forEach((entry) => {
    const count = roomCounts.get(entry.odRoomCode) || 0;
    roomCounts.set(entry.odRoomCode, count + 1);
  });

  return {
    totalConnections,
    availableSlots: CONNECTION_LIMITS.MAX_TOTAL_CONNECTIONS - totalConnections,
    isAtCapacity: totalConnections >= CONNECTION_LIMITS.MAX_TOTAL_CONNECTIONS,
    isNearCapacity: totalConnections >= CONNECTION_LIMITS.WARNING_THRESHOLD,
    roomCounts: Object.fromEntries(roomCounts),
    activeRooms: roomCounts.size,
  };
}

// Check if a new connection can be accepted
export function canConnect(roomCode: string): {
  allowed: boolean;
  reason?: string;
  position?: number;
  stats: ReturnType<typeof getConnectionStats>;
} {
  const stats = getConnectionStats();

  if (stats.isAtCapacity) {
    // Calculate wait position
    const position = stats.totalConnections - CONNECTION_LIMITS.MAX_TOTAL_CONNECTIONS + 1;
    return {
      allowed: false,
      reason: 'Server is at maximum capacity. Please wait for a spot to open.',
      position: Math.max(1, position),
      stats,
    };
  }

  const roomCount = stats.roomCounts[roomCode] || 0;
  if (roomCount >= CONNECTION_LIMITS.MAX_PER_ROOM) {
    return {
      allowed: false,
      reason: `This room is full (${CONNECTION_LIMITS.MAX_PER_ROOM} players max). Try joining as a spectator or wait for someone to leave.`,
      stats,
    };
  }

  return { allowed: true, stats };
}

// Register a new connection
export function registerConnection(odId: string, roomCode: string): boolean {
  const check = canConnect(roomCode);
  if (!check.allowed) {
    return false;
  }

  connections.set(odId, {
    odId,
    odRoomCode: roomCode,
    connectedAt: Date.now(),
    lastPing: Date.now(),
  });

  return true;
}

// Update connection ping (heartbeat)
export function pingConnection(odId: string): boolean {
  const entry = connections.get(odId);
  if (entry) {
    entry.lastPing = Date.now();
    return true;
  }
  return false;
}

// Remove a connection
export function removeConnection(odId: string): boolean {
  return connections.delete(odId);
}

// Get all connections for a room
export function getRoomConnections(roomCode: string): string[] {
  const roomConnections: string[] = [];
  connections.forEach((entry, odId) => {
    if (entry.odRoomCode === roomCode) {
      roomConnections.push(odId);
    }
  });
  return roomConnections;
}

// Waiting room queue
const waitingQueue = new Map<string, {
  odId: string;
  roomCode: string;
  joinedAt: number;
  playerName: string;
}>();

export function addToWaitingRoom(odId: string, roomCode: string, playerName: string): number {
  waitingQueue.set(odId, {
    odId,
    roomCode,
    joinedAt: Date.now(),
    playerName,
  });

  // Return position in queue
  let position = 0;
  waitingQueue.forEach((entry) => {
    if (entry.joinedAt <= waitingQueue.get(odId)!.joinedAt) {
      position++;
    }
  });

  return position;
}

export function removeFromWaitingRoom(odId: string): boolean {
  return waitingQueue.delete(odId);
}

export function getWaitingRoomPosition(odId: string): number | null {
  const entry = waitingQueue.get(odId);
  if (!entry) return null;

  let position = 0;
  waitingQueue.forEach((e) => {
    if (e.joinedAt <= entry.joinedAt) {
      position++;
    }
  });

  return position;
}

interface WaitingEntry {
  odId: string;
  roomCode: string;
  playerName: string;
  joinedAt: number;
}

export function getNextInWaitingRoom(): { odId: string; roomCode: string; playerName: string } | null {
  let oldestEntry: WaitingEntry | null = null;

  waitingQueue.forEach((entry) => {
    if (!oldestEntry || entry.joinedAt < oldestEntry.joinedAt) {
      oldestEntry = { odId: entry.odId, roomCode: entry.roomCode, playerName: entry.playerName, joinedAt: entry.joinedAt };
    }
  });

  if (oldestEntry !== null) {
    const result = oldestEntry as WaitingEntry;
    waitingQueue.delete(result.odId);
    return { odId: result.odId, roomCode: result.roomCode, playerName: result.playerName };
  }

  return null;
}
