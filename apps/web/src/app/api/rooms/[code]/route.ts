import { NextRequest, NextResponse } from 'next/server';
import { getRoom, joinRoom, updateRoom, leaveRoom } from '@shared/lib/roomStore';

// GET /api/rooms/[code] - Check if room exists and get info
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const room = getRoom(code.toUpperCase());

  if (!room) {
    return NextResponse.json(
      { exists: false, error: 'Room not found' },
      { status: 404 }
    );
  }

  const canJoin = room.status === 'lobby' && room.playerCount < room.maxPlayers;

  return NextResponse.json({
    exists: true,
    canJoin,
    room: {
      code: room.code,
      gameType: room.gameType,
      roomName: room.roomName,
      hostName: room.hostName,
      playerCount: room.playerCount,
      maxPlayers: room.maxPlayers,
      status: room.status,
      hasZoomLink: !!room.zoomLink,
      zoomLink: room.zoomLink,
      zoomPassword: room.zoomPassword,
    },
  });
}

// POST /api/rooms/[code] - Join room or update status
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json();
    const { action, playerName, playerId, status } = body;

    const upperCode = code.toUpperCase();

    if (action === 'join') {
      const result = joinRoom(upperCode);
      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        room: result.room
      });
    }

    if (action === 'update-status') {
      const room = updateRoom(upperCode, { status });
      if (!room) {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, room });
    }

    if (action === 'leave') {
      leaveRoom(upperCode, playerId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Room action error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
