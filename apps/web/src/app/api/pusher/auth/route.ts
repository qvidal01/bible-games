import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@shared/lib/pusher';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const socketId = formData.get('socket_id') as string;
    const channelName = formData.get('channel_name') as string;

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Missing socket_id or channel_name' },
        { status: 400 }
      );
    }

    // For presence channels, authorize with user data
    if (channelName.startsWith('presence-')) {
      // In production, you'd verify the user's identity here
      const presenceData = {
        user_id: `user_${socketId.replace(/\./g, '_')}`,
        user_info: {
          connectedAt: Date.now(),
        },
      };

      const authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData);
      return NextResponse.json(authResponse);
    }

    // For private channels
    if (channelName.startsWith('private-')) {
      const authResponse = pusherServer.authorizeChannel(socketId, channelName);
      return NextResponse.json(authResponse);
    }

    return NextResponse.json(
      { error: 'Invalid channel type' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json(
      { error: 'Authorization failed' },
      { status: 500 }
    );
  }
}
