import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getRoom } from '@shared/lib/roomStore';
import { playerNameSchema, roomCodeSchema } from '@shared/lib/validation';

const bodySchema = z.object({
  action: z.enum(['connect', 'disconnect', 'ping']),
  roomCode: roomCodeSchema.optional(),
  playerId: z.string().min(1).optional(),
  // Legacy key from existing client usage
  odId: z.string().min(1).optional(),
  playerName: playerNameSchema.optional(),
});

const roomConnections = new Map<string, Set<string>>();

const getConnectionSet = (code: string) => {
  const existing = roomConnections.get(code);
  if (existing) return existing;
  const created = new Set<string>();
  roomConnections.set(code, created);
  return created;
};

export async function POST(req: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Invalid payload' },
        { status: 400 }
      );
    }

    const { action, roomCode, playerId, odId, playerName } = parsed.data;
    const id = playerId || odId;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'playerId is required' },
        { status: 400 }
      );
    }

    if (action === 'ping') {
      return NextResponse.json({ success: true });
    }

    if (!roomCode) {
      return NextResponse.json(
        { success: false, error: 'roomCode is required' },
        { status: 400 }
      );
    }

    const room = getRoom(roomCode);
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    const connections = getConnectionSet(roomCode);
    const maxConnections = Math.max(room.maxPlayers, 1) * 2; // allow spectators

    if (action === 'connect') {
      if (!connections.has(id) && connections.size >= maxConnections) {
        return NextResponse.json({
          success: false,
          inWaitingRoom: true,
          position: connections.size - maxConnections + 1,
          reason: 'Room at capacity',
        });
      }

      connections.add(id);
      return NextResponse.json({
        success: true,
        playerName,
        connectedCount: connections.size,
        capacity: maxConnections,
      });
    }

    // disconnect
    connections.delete(id);
    if (connections.size === 0) {
      roomConnections.delete(roomCode);
    }
    return NextResponse.json({ success: true, connectedCount: connections.size });
  } catch (error) {
    console.error('Connection route error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process connection request' },
      { status: 500 }
    );
  }
}
