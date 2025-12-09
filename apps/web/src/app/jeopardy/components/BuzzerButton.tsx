'use client';

interface BuzzerButtonProps {
  onBuzz: () => void;
  disabled: boolean;
  buzzedPlayerName?: string;
  isCurrentBuzzer: boolean;
}

export default function BuzzerButton({
  onBuzz,
  disabled,
  buzzedPlayerName,
  isCurrentBuzzer,
}: BuzzerButtonProps) {
  if (buzzedPlayerName) {
    return (
      <div className={`
        fixed bottom-0 left-0 right-0 p-4 z-40
        ${isCurrentBuzzer ? 'bg-green-600' : 'bg-yellow-600'}
      `}>
        <div className="max-w-lg mx-auto text-center">
          <p className="text-white text-xl font-bold">
            {isCurrentBuzzer ? "You buzzed in! Answer now!" : `${buzzedPlayerName} buzzed in!`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-blue-950 to-transparent z-40">
      <div className="max-w-lg mx-auto">
        <button
          onClick={onBuzz}
          disabled={disabled}
          className={`
            w-full py-8 rounded-2xl text-3xl font-bold transition-all transform
            ${disabled
              ? 'bg-blue-900 text-blue-700 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 text-white hover:scale-105 active:scale-95 shadow-2xl animate-pulse'
            }
          `}
        >
          {disabled ? 'Wait for Question...' : 'BUZZ IN!'}
        </button>
      </div>
    </div>
  );
}
