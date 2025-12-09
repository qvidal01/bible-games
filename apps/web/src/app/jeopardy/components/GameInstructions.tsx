'use client';

import { useState } from 'react';

interface GameInstructionsProps {
  isHost: boolean;
  isTeamMode: boolean;
  compact?: boolean;
}

export default function GameInstructions({ isHost, isTeamMode, compact = false }: GameInstructionsProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  return (
    <div className="bg-blue-900/60 rounded-xl border border-blue-700/50 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-blue-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-yellow-400 font-semibold">How to Play</span>
        </div>
        <svg
          className={`w-5 h-5 text-blue-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content - Collapsible */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Game Flow */}
          <div>
            <h4 className="text-blue-200 font-medium text-sm mb-2">Game Flow</h4>
            <ol className="text-blue-300 text-sm space-y-1 list-decimal list-inside">
              <li>Host selects 5 categories from 20 available</li>
              <li>Host clicks a dollar value to reveal the question</li>
              <li>Players buzz in to answer (tap the BUZZ button)</li>
              <li>Host judges if the answer is correct or wrong</li>
              <li>After all questions, Final Jeopardy begins</li>
            </ol>
          </div>

          {/* Scoring */}
          <div>
            <h4 className="text-blue-200 font-medium text-sm mb-2">Scoring</h4>
            <ul className="text-blue-300 text-sm space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-green-400">+</span>
                Correct answer = Add points to your score
              </li>
              <li className="flex items-center gap-2">
                <span className="text-red-400">-</span>
                Wrong answer = Points subtracted from score
              </li>
              {isTeamMode && (
                <li className="flex items-center gap-2">
                  <span className="text-yellow-400">Team</span>
                  Points add to your team&apos;s total
                </li>
              )}
            </ul>
          </div>

          {/* Special Features */}
          <div>
            <h4 className="text-blue-200 font-medium text-sm mb-2">Special Features</h4>
            <ul className="text-blue-300 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400 font-bold text-xs bg-yellow-500/20 px-1.5 py-0.5 rounded">DD</span>
                <span><strong>Daily Double</strong> - Wager any amount up to your score (or $1,000/$2,000 minimum)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold text-xs bg-purple-500/20 px-1.5 py-0.5 rounded">FJ</span>
                <span><strong>Final Jeopardy</strong> - All players wager, write answers, then reveal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold text-xs bg-blue-500/20 px-1.5 py-0.5 rounded">R2</span>
                <span><strong>Double Jeopardy</strong> - Round 2 has double point values</span>
              </li>
            </ul>
          </div>

          {/* Role-specific tips */}
          {isHost ? (
            <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/30">
              <h4 className="text-yellow-400 font-medium text-sm mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Host Tips
              </h4>
              <ul className="text-yellow-200/80 text-xs space-y-1">
                <li>Click dollar values to reveal questions</li>
                <li>Use Correct/Wrong buttons to judge answers</li>
                <li>Click &quot;Reveal Answer&quot; if no one knows</li>
                <li>Allow players time to read before judging</li>
              </ul>
            </div>
          ) : (
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
              <h4 className="text-blue-400 font-medium text-sm mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Player Tips
              </h4>
              <ul className="text-blue-200/80 text-xs space-y-1">
                <li>Tap BUZZ quickly when you know the answer</li>
                <li>Answer out loud - the host will judge</li>
                <li>Phrase as &quot;What is...&quot; or &quot;Who is...&quot;</li>
                <li>Be strategic with Daily Double wagers!</li>
              </ul>
            </div>
          )}

          {/* Quick Reference */}
          <div className="pt-2 border-t border-blue-700/50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 text-blue-300">
                <span className="w-3 h-3 rounded bg-green-500"></span>
                Correct answer
              </div>
              <div className="flex items-center gap-2 text-blue-300">
                <span className="w-3 h-3 rounded bg-red-500"></span>
                Wrong answer
              </div>
              <div className="flex items-center gap-2 text-blue-300">
                <span className="w-3 h-3 rounded bg-yellow-500"></span>
                Daily Double
              </div>
              <div className="flex items-center gap-2 text-blue-300">
                <span className="w-3 h-3 rounded bg-purple-500"></span>
                Final Jeopardy
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
