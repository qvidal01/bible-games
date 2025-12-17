'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  roomCode: string;
  size?: number;
  gameType?: 'jeopardy' | 'family-feud' | 'tic-tac-toe' | 'memory-match';
}

export default function QRCodeDisplay({ roomCode, size = 200, gameType = 'jeopardy' }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const joinUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/${gameType}/join/${roomCode}`
          : `https://games.aiqso.io/${gameType}/join/${roomCode}`;

        const dataUrl = await QRCode.toDataURL(joinUrl, {
          width: size,
          margin: 2,
          color: {
            dark: '#1e3a5f',
            light: '#fbbf24',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    generateQR();
  }, [roomCode, size, gameType]);

  if (!qrDataUrl) {
    return (
      <div
        className="bg-yellow-400 rounded-lg animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className="bg-yellow-400 p-2 rounded-lg">
      <img
        src={qrDataUrl}
        alt={`QR code to join room ${roomCode}`}
        width={size}
        height={size}
        className="rounded"
      />
    </div>
  );
}
