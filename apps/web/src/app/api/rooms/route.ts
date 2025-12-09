import { NextRequest, NextResponse } from 'next/server';
import { createRoom, getAllRooms, getPublicRooms } from '@shared/lib/roomStore';
import { generateRoomCode, createGameSchema } from '@shared/lib/validation';
import { GameType } from '@shared/types';

// POST /api/rooms - Create a new room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = createGameSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { playerName, roomName, zoomLink, zoomPassword, description, isPrivate, maxPlayers, gameType } = result.data;
    const playerId = body.playerId;

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    // Generate unique room code
    let roomCode = generateRoomCode();
    let attempts = 0;
    const existingCodes = new Set(getAllRooms().map(r => r.code));

    while (existingCodes.has(roomCode) && attempts < 10) {
      roomCode = generateRoomCode();
      attempts++;
    }

    // Create the room with options
    const room = createRoom(roomCode, playerId, playerName, {
      gameType: gameType as GameType,
      roomName,
      zoomLink: zoomLink || undefined,
      zoomPassword,
      description,
      isPrivate,
      maxPlayers,
    });

    return NextResponse.json({
      success: true,
      room: {
        code: room.code,
        gameType: room.gameType,
        hostId: room.hostId,
        roomName: room.roomName,
        zoomLink: room.zoomLink,
        isPrivate: room.isPrivate,
        maxPlayers: room.maxPlayers,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
      },
    });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

// GET /api/rooms - List public rooms (for room browser)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const showAll = searchParams.get('all') === 'true';
  const gameType = searchParams.get('gameType') as GameType | null;

  // Show all rooms only for admin/debugging
  if (showAll) {
    const rooms = getAllRooms();
    return NextResponse.json({
      count: rooms.length,
      rooms: rooms.map(r => ({
        code: r.code,
        gameType: r.gameType,
        roomName: r.roomName,
        hostName: r.hostName,
        playerCount: r.playerCount,
        maxPlayers: r.maxPlayers,
        status: r.status,
        isPrivate: r.isPrivate,
        hasZoomLink: !!r.zoomLink,
        createdAt: r.createdAt,
      })),
    });
  }

  // Default: show only public rooms in lobby (optionally filtered by game type)
  const publicRooms = getPublicRooms(gameType || undefined);
  return NextResponse.json({
    count: publicRooms.length,
    rooms: publicRooms.map(r => ({
      code: r.code,
      gameType: r.gameType,
      roomName: r.roomName,
      hostName: r.hostName,
      description: r.description,
      playerCount: r.playerCount,
      maxPlayers: r.maxPlayers,
      hasZoomLink: !!r.zoomLink,
      createdAt: r.createdAt,
    })),
  });
}
