'use client';

import { useEffect, useState, useRef } from 'react';
import { Team, Player } from '../types/game';
import { playSound } from '@shared/lib/sounds';

interface TeamScoreboardProps {
  teams: { red: Team; blue: Team };
  players: Player[];
  controllingTeam: 'red' | 'blue' | null;
  roundPoints: number;
  round: number;
  maxRounds: number;
}

// Animated score counter
function AnimatedScore({ score, color }: { score: number; color: 'red' | 'blue' }) {
  const [displayScore, setDisplayScore] = useState(score);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      const diff = score - prevScore.current;
      const isIncreasing = diff > 0;

      if (isIncreasing) {
        playSound('correct');
        setIsAnimating(true);

        // Animate counting up
        const steps = Math.min(Math.abs(diff), 20);
        const stepSize = diff / steps;
        let current = prevScore.current;
        let step = 0;

        const interval = setInterval(() => {
          step++;
          current += stepSize;
          setDisplayScore(Math.round(current));

          if (step >= steps) {
            clearInterval(interval);
            setDisplayScore(score);
            setIsAnimating(false);
          }
        }, 50);

        prevScore.current = score;
        return () => clearInterval(interval);
      } else {
        setDisplayScore(score);
        prevScore.current = score;
      }
    }
  }, [score]);

  return (
    <div className={`
      text-4xl md:text-6xl font-bold text-white transition-all duration-300
      ${isAnimating ? 'scale-110 text-yellow-300' : ''}
    `}>
      {displayScore.toLocaleString()}
      {isAnimating && (
        <span className="absolute -top-2 -right-2 text-lg text-green-400 animate-bounce">
          +
        </span>
      )}
    </div>
  );
}

export default function TeamScoreboard({
  teams,
  controllingTeam,
  roundPoints,
  round,
  maxRounds,
}: TeamScoreboardProps) {
  const [pointsAnimating, setPointsAnimating] = useState(false);
  const prevRoundPoints = useRef(roundPoints);

  // Animate when round points increase
  useEffect(() => {
    if (roundPoints > prevRoundPoints.current) {
      setPointsAnimating(true);
      const timer = setTimeout(() => setPointsAnimating(false), 500);
      prevRoundPoints.current = roundPoints;
      return () => clearTimeout(timer);
    }
    prevRoundPoints.current = roundPoints;
  }, [roundPoints]);

  // Determine leader
  const leader = teams.red.score > teams.blue.score ? 'red' :
                 teams.blue.score > teams.red.score ? 'blue' : null;

  return (
    <div className="w-full">
      {/* Round Info */}
      <div className="text-center mb-4">
        <div className="inline-block bg-red-900/60 px-4 py-2 rounded-full border border-red-700">
          <span className="text-red-300 text-lg font-medium">
            Round {round} of {maxRounds}
          </span>
        </div>
        {roundPoints > 0 && (
          <div className={`
            mt-3 transition-all duration-300
            ${pointsAnimating ? 'scale-110' : ''}
          `}>
            <div className="inline-block bg-yellow-500/20 border-2 border-yellow-500 px-6 py-2 rounded-xl">
              <span className="text-yellow-400 text-sm uppercase tracking-wider">Points at Stake</span>
              <div className={`
                text-3xl md:text-4xl font-bold text-yellow-400
                ${pointsAnimating ? 'animate-pulse' : ''}
              `}>
                {roundPoints.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Scores */}
      <div className="flex justify-between items-stretch gap-4">
        {/* Red Team */}
        <div className={`
          flex-1 rounded-2xl p-4 md:p-6 border-4 transition-all duration-300 relative
          ${controllingTeam === 'red'
            ? 'bg-gradient-to-b from-red-600 to-red-700 border-yellow-400 scale-105 shadow-lg shadow-red-500/30'
            : 'bg-red-900/60 border-red-700'
          }
        `}>
          {/* Leader crown */}
          {leader === 'red' && teams.red.score > 0 && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">👑</div>
          )}

          <div className="text-center">
            <h3 className="text-red-200 font-bold text-lg md:text-xl mb-2">{teams.red.name}</h3>
            <div className="relative inline-block">
              <AnimatedScore score={teams.red.score} color="red" />
            </div>
            {controllingTeam === 'red' && (
              <div className="mt-3">
                <span className="inline-block px-4 py-1 bg-yellow-500 text-red-900 text-sm font-bold rounded-full animate-pulse">
                  PLAYING
                </span>
              </div>
            )}
            {/* Mini Strikes */}
            {teams.red.strikes > 0 && (
              <div className="flex justify-center gap-2 mt-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all
                      ${i < teams.red.strikes
                        ? 'bg-red-500 border-red-400'
                        : 'bg-red-900/30 border-red-800'
                      }
                    `}
                  >
                    <span className={`text-lg font-bold ${i < teams.red.strikes ? 'text-white' : 'text-red-800'}`}>
                      X
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center">
          <div className="bg-red-800 rounded-full w-12 h-12 flex items-center justify-center border-2 border-red-600">
            <span className="text-yellow-400 font-bold text-sm">VS</span>
          </div>
        </div>

        {/* Blue Team */}
        <div className={`
          flex-1 rounded-2xl p-4 md:p-6 border-4 transition-all duration-300 relative
          ${controllingTeam === 'blue'
            ? 'bg-gradient-to-b from-blue-600 to-blue-700 border-yellow-400 scale-105 shadow-lg shadow-blue-500/30'
            : 'bg-blue-900/60 border-blue-700'
          }
        `}>
          {/* Leader crown */}
          {leader === 'blue' && teams.blue.score > 0 && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">👑</div>
          )}

          <div className="text-center">
            <h3 className="text-blue-200 font-bold text-lg md:text-xl mb-2">{teams.blue.name}</h3>
            <div className="relative inline-block">
              <AnimatedScore score={teams.blue.score} color="blue" />
            </div>
            {controllingTeam === 'blue' && (
              <div className="mt-3">
                <span className="inline-block px-4 py-1 bg-yellow-500 text-blue-900 text-sm font-bold rounded-full animate-pulse">
                  PLAYING
                </span>
              </div>
            )}
            {/* Mini Strikes */}
            {teams.blue.strikes > 0 && (
              <div className="flex justify-center gap-2 mt-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`
                      w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all
                      ${i < teams.blue.strikes
                        ? 'bg-blue-500 border-blue-400'
                        : 'bg-blue-900/30 border-blue-800'
                      }
                    `}
                  >
                    <span className={`text-lg font-bold ${i < teams.blue.strikes ? 'text-white' : 'text-blue-800'}`}>
                      X
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
