'use client';

import { useState } from 'react';
import QRCodeDisplay from './QRCodeDisplay';
import { GameType } from '@shared/types';

interface InvitePanelProps {
  roomCode: string;
  gameType?: GameType;
  compact?: boolean;
}

export default function InvitePanel({ roomCode, gameType = 'jeopardy', compact = false }: InvitePanelProps) {
  const [showQR, setShowQR] = useState(!compact);
  const [copied, setCopied] = useState(false);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareGame = async () => {
    const shareUrl = `${window.location.origin}/${gameType}/join/${roomCode}`;
    const gameNames: Record<string, string> = {
      'jeopardy': 'Bible Jeopardy',
      'family-feud': 'Bible Family Feud',
      'tic-tac-toe': 'Bible Tic Tac Toe',
      'memory-match': 'Bible Memory Match',
    };
    const gameName = gameNames[gameType] || 'Bible Games';
    const shareData = {
      title: `${gameName} - JW Edition`,
      text: `Join my ${gameName} game! Room code: ${roomCode}`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  if (compact) {
    return (
      <div className="bg-blue-900/80 rounded-xl p-3 border border-blue-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-blue-300 text-xs">Invite Players</span>
          <button
            onClick={() => setShowQR(!showQR)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {showQR ? 'Hide' : 'Show'} QR
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl font-bold text-yellow-400 tracking-wider">
            {roomCode}
          </span>
          <button
            onClick={copyRoomCode}
            className={`p-1.5 rounded transition-colors ${
              copied ? 'bg-green-600' : 'bg-blue-700 hover:bg-blue-600'
            }`}
            title={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        {showQR && (
          <div className="flex justify-center mb-2">
            <QRCodeDisplay roomCode={roomCode} gameType={gameType} size={120} />
          </div>
        )}

        <button
          onClick={shareGame}
          className="w-full py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share Link
        </button>
      </div>
    );
  }

  return (
    <div className="bg-blue-900/80 rounded-2xl p-4 border border-blue-700">
      <h3 className="text-yellow-400 font-bold text-center mb-3">Invite Players</h3>

      <div className="text-center mb-3">
        <p className="text-blue-300 text-xs mb-1">Room Code</p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl font-bold text-yellow-400 tracking-wider">
            {roomCode}
          </span>
          <button
            onClick={copyRoomCode}
            className={`p-2 rounded-lg transition-colors ${
              copied ? 'bg-green-600' : 'bg-blue-700 hover:bg-blue-600'
            }`}
            title={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex justify-center mb-3">
        <QRCodeDisplay roomCode={roomCode} gameType={gameType} size={150} />
      </div>

      <button
        onClick={shareGame}
        className="w-full py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share Invite Link
      </button>

      <p className="text-blue-400 text-xs text-center mt-2">
        Scan QR or enter code at games.aiqso.io
      </p>
    </div>
  );
}
