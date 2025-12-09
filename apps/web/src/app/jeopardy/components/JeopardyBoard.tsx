'use client';

import { GameBoard, Question } from '../types/game';

interface JeopardyBoardProps {
  board: GameBoard;
  onSelectQuestion: (question: Question) => void;
  isHost: boolean;
  disabled?: boolean;
}

export default function JeopardyBoard({
  board,
  onSelectQuestion,
  isHost,
  disabled = false,
}: JeopardyBoardProps) {
  const values = [200, 400, 600, 800, 1000];

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-5 gap-2 md:gap-3">
        {/* Category Headers */}
        {board.categories.map((category) => (
          <div
            key={category.id}
            className="bg-blue-800 p-2 md:p-4 text-center rounded-lg shadow-lg border-2 border-blue-600"
          >
            <h3 className="text-xs md:text-sm lg:text-base font-bold text-white uppercase leading-tight">
              {category.name}
            </h3>
          </div>
        ))}

        {/* Question Grid */}
        {values.map((value) => (
          board.categories.map((category) => {
            const question = category.questions.find((q) => q.value === value);
            if (!question) return null;

            return (
              <button
                key={question.id}
                onClick={() => !question.isAnswered && !disabled && isHost && onSelectQuestion(question)}
                disabled={question.isAnswered || disabled || !isHost}
                className={`
                  aspect-[4/3] md:aspect-square flex items-center justify-center rounded-lg shadow-lg
                  text-xl md:text-2xl lg:text-3xl font-bold transition-all transform
                  ${question.isAnswered
                    ? 'bg-blue-950/50 text-blue-900/30 cursor-default'
                    : isHost && !disabled
                      ? 'bg-blue-700 text-yellow-400 hover:bg-blue-600 hover:scale-105 cursor-pointer border-2 border-blue-500'
                      : 'bg-blue-700 text-yellow-400 cursor-default border-2 border-blue-500'
                  }
                `}
              >
                {!question.isAnswered && `$${value}`}
              </button>
            );
          })
        ))}
      </div>
    </div>
  );
}
