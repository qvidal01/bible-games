import { NextRequest, NextResponse } from 'next/server';
import { pusherServer, getGameChannel } from '@shared/lib/pusher';
import { broadcastEventSchema } from '@shared/lib/validation';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { resetActivity } from '@shared/lib/roomStore';

// Rate limiting (20 requests per second per IP)
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 s'),
    analytics: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit check
    if (ratelimit) {
      const ip = req.headers.get('x-forwarded-for') || 'anonymous';
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        );
      }
    }

    const body = await req.json();

    // Validate input
    const result = broadcastEventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { roomCode, event, data } = result.data;

    // Reset activity timer on any game action (except inactivity warnings themselves)
    if (!event.startsWith('inactivity-')) {
      resetActivity(roomCode);
    }

    // Broadcast to the game channel
    const channel = getGameChannel(roomCode);
    await pusherServer.trigger(channel, event, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { error: 'Failed to broadcast event' },
      { status: 500 }
    );
  }
}
