import { NextRequest, NextResponse } from 'next/server';
import { pusherServer, getGameChannel, SHARED_EVENTS } from '@shared/lib/pusher';
import {
  getRoomsNeedingAction,
  markWarningSent,
  deleteRoom,
  updateRoom,
  TIMEOUTS,
} from '@shared/lib/roomStore';

// This endpoint checks all rooms for inactivity and broadcasts warnings
// Should be called periodically (every 60 seconds)
export async function POST(req: NextRequest) {
  try {
    // Optional: Add a secret token for security
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.INACTIVITY_CHECK_TOKEN || 'inactivity-check-secret';

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { needsWarning1, needsWarning2, needsTimeout, needsExpire } = getRoomsNeedingAction();
    const results = {
      warning1Sent: 0,
      warning2Sent: 0,
      timedOut: 0,
      expired: 0,
    };

    // Send first warning (10 min inactivity)
    for (const room of needsWarning1) {
      const channel = getGameChannel(room.code);
      await pusherServer.trigger(channel, SHARED_EVENTS.INACTIVITY_WARNING, {
        level: 1,
        message: 'No activity detected for 10 minutes. Game will end in 20 minutes if no activity.',
        minutesRemaining: 20,
      });
      markWarningSent(room.code, 1);
      results.warning1Sent++;
    }

    // Send second warning (20 min inactivity)
    for (const room of needsWarning2) {
      const channel = getGameChannel(room.code);
      await pusherServer.trigger(channel, SHARED_EVENTS.INACTIVITY_WARNING, {
        level: 2,
        message: 'Final warning! Game will end in 10 minutes if no activity.',
        minutesRemaining: 10,
      });
      markWarningSent(room.code, 2);
      results.warning2Sent++;
    }

    // End games due to inactivity (30 min)
    for (const room of needsTimeout) {
      const channel = getGameChannel(room.code);
      await pusherServer.trigger(channel, SHARED_EVENTS.INACTIVITY_TIMEOUT, {
        reason: 'inactivity',
        message: 'Game ended due to 30 minutes of inactivity.',
      });
      await pusherServer.trigger(channel, SHARED_EVENTS.GAME_ENDED, {
        reason: 'inactivity',
        message: 'Game ended due to 30 minutes of inactivity.',
      });
      deleteRoom(room.code);
      results.timedOut++;
    }

    // End games due to session expiration (90 min)
    for (const room of needsExpire) {
      const channel = getGameChannel(room.code);
      await pusherServer.trigger(channel, SHARED_EVENTS.GAME_ENDED, {
        reason: 'expired',
        message: 'Game session expired after 90 minutes.',
      });
      deleteRoom(room.code);
      results.expired++;
    }

    return NextResponse.json({
      success: true,
      results,
      timeouts: {
        roomTTL: TIMEOUTS.ROOM_TTL / 60000 + ' minutes',
        warning1: TIMEOUTS.INACTIVITY_WARNING_1 / 60000 + ' minutes',
        warning2: TIMEOUTS.INACTIVITY_WARNING_2 / 60000 + ' minutes',
        timeout: TIMEOUTS.INACTIVITY_TIMEOUT / 60000 + ' minutes',
      },
    });
  } catch (error) {
    console.error('Inactivity check error:', error);
    return NextResponse.json(
      { error: 'Failed to check inactivity' },
      { status: 500 }
    );
  }
}

// GET endpoint for manual status check
export async function GET(req: NextRequest) {
  const { needsWarning1, needsWarning2, needsTimeout, needsExpire } = getRoomsNeedingAction();

  return NextResponse.json({
    roomsNeedingAction: {
      needsWarning1: needsWarning1.length,
      needsWarning2: needsWarning2.length,
      needsTimeout: needsTimeout.length,
      needsExpire: needsExpire.length,
    },
    timeouts: {
      roomTTL: TIMEOUTS.ROOM_TTL / 60000 + ' minutes',
      warning1: TIMEOUTS.INACTIVITY_WARNING_1 / 60000 + ' minutes',
      warning2: TIMEOUTS.INACTIVITY_WARNING_2 / 60000 + ' minutes',
      timeout: TIMEOUTS.INACTIVITY_TIMEOUT / 60000 + ' minutes',
    },
  });
}
