import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  createRoom,
  getRoom,
  joinRoom,
  updateRoom,
  cleanupExpiredRooms,
  clearRooms,
} from './roomStore';

describe('roomStore', () => {
  afterEach(() => {
    clearRooms();
    vi.useRealTimers();
  });

  test('creates rooms with expected defaults', () => {
    const room = createRoom('ABC123', 'host-1', 'Host Name');
    const stored = getRoom('ABC123');

    expect(room.code).toBe('ABC123');
    expect(room.status).toBe('lobby');
    expect(stored?.playerCount).toBe(1);
    expect(stored?.gameType).toBe('jeopardy');
    expect(stored?.expiresAt).toBeGreaterThan(room.createdAt);
  });

  test('prevents joining full or in-progress rooms', () => {
    createRoom('ROOM99', 'host-2', 'Host', { maxPlayers: 2 });

    const firstJoin = joinRoom('ROOM99');
    expect(firstJoin.success).toBe(true);

    // Move room to playing state to block late joins
    updateRoom('ROOM99', { status: 'playing' });

    const lateJoin = joinRoom('ROOM99');
    expect(lateJoin.success).toBe(false);
    expect(lateJoin.error).toContain('progress');
  });

  test('cleans up expired rooms', () => {
    vi.useFakeTimers();

    const now = Date.now();
    vi.setSystemTime(now);
    createRoom('STALE01', 'host-3', 'Host');

    // Advance time beyond TTL (4 hours)
    vi.setSystemTime(now + 5 * 60 * 60 * 1000);
    const removed = cleanupExpiredRooms();

    expect(removed).toBe(1);
    expect(getRoom('STALE01')).toBeNull();
  });
});
