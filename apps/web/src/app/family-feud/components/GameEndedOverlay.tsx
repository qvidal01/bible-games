'use client';

import { useRouter } from 'next/navigation';

interface GameEndedOverlayProps {
  reason: 'host-timeout' | 'host-ended' | 'inactivity';
  hostName?: string;
}

export default function GameEndedOverlay({ reason, hostName }: GameEndedOverlayProps) {
  const router = useRouter();

  const messages = {
    'host-timeout': {
      icon: '\u23F1\uFE0F',
      title: 'Game Ended',
      subtitle: `${hostName || 'The host'} didn't rejoin in time.`,
      description: 'The game has ended because the host was disconnected for too long.',
    },
    'host-ended': {
      icon: '\uD83D\uDED1',
      title: 'Game Ended by Host',
      subtitle: `${hostName || 'The host'} ended the game.`,
      description: 'Thanks for playing! The host has closed this game session.',
    },
    'inactivity': {
      icon: '\uD83D\uDCA4',
      title: 'Game Ended',
      subtitle: 'No activity for 30 minutes.',
      description: 'This game was automatically ended due to inactivity.',
    },
  };

  const message = messages[reason];

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="bg-red-900/90 border-4 border-yellow-500 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">
          <span role="img" aria-label="game ended">{message.icon}</span>
        </div>

        <h2 className="text-3xl font-bold text-yellow-400 mb-2">
          {message.title}
        </h2>

        <p className="text-red-200 text-lg mb-4">
          {message.subtitle}
        </p>

        <p className="text-red-400 mb-8">
          {message.description}
        </p>

        <button
          onClick={() => router.push('/')}
          className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-red-900 font-bold text-lg rounded-xl
                     transition-all transform hover:scale-105
                     focus:outline-none focus:ring-4 focus:ring-yellow-300"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
}
