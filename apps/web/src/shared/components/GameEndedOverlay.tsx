'use client';

import Link from 'next/link';

type EndReason = 'host-ended' | 'host-timeout' | 'inactivity' | 'completed' | 'unknown';

function getReasonCopy(reason: EndReason, hostName?: string) {
  switch (reason) {
    case 'host-ended':
      return hostName ? `${hostName} ended the game.` : 'The host ended the game.';
    case 'host-timeout':
      return 'The host disconnected for too long.';
    case 'inactivity':
      return 'The game ended due to inactivity.';
    case 'completed':
      return 'The game has finished.';
    default:
      return 'The game has ended.';
  }
}

export default function GameEndedOverlay(props: {
  title: string;
  reason?: EndReason;
  hostName?: string;
  primaryAction: { label: string; href: string };
  secondaryAction?: { label: string; onClick: () => void };
}) {
  const reason = props.reason ?? 'unknown';
  const copy = getReasonCopy(reason, props.hostName);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950 rounded-2xl p-8 max-w-md w-full border border-white/10 text-center shadow-2xl">
        <div className="text-6xl mb-4">🏁</div>
        <h2 className="text-3xl font-black text-yellow-300 mb-2">{props.title}</h2>
        <p className="text-white/80 mb-6">{copy}</p>

        <div className="flex gap-3 justify-center">
          <Link
            href={props.primaryAction.href}
            className="px-6 py-3 bg-yellow-300 hover:bg-yellow-200 text-blue-950 font-black rounded-lg transition-colors"
          >
            {props.primaryAction.label}
          </Link>
          {props.secondaryAction && (
            <button
              onClick={props.secondaryAction.onClick}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-lg transition-colors"
            >
              {props.secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

