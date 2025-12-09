'use client';

import { Player, Team } from '../types/game';

interface ScoreboardProps {
  players: Player[];
  hostId: string;
  teams?: Team[];
  isTeamMode?: boolean;
}

export default function Scoreboard({
  players,
  hostId,
  teams = [],
  isTeamMode = false,
}: ScoreboardProps) {
  // Filter out host and sort players by score (descending)
  // Host is the game facilitator, not a player
  const sortedPlayers = [...players]
    .filter(p => p.id !== hostId)
    .sort((a, b) => b.score - a.score);

  // Sort teams by score
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  // Get team color style
  const getTeamColor = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team?.color || 'blue';
  };

  return (
    <div
      className="bg-blue-900/50 rounded-xl p-4 border border-blue-700"
      role="region"
      aria-label="Scoreboard"
    >
      <h3 className="text-yellow-400 font-bold text-lg mb-3 text-center">
        Scores
      </h3>

      {/* Team Mode Display */}
      {isTeamMode && sortedTeams.length > 0 && (
        <div className="mb-4 pb-4 border-b border-blue-700">
          <h4 className="text-blue-300 text-sm mb-2">Teams</h4>
          <div className="space-y-2">
            {sortedTeams.map((team, index) => (
              <div
                key={team.id}
                className={`flex justify-between items-center px-3 py-2 rounded-lg
                  ${index === 0 && team.score > 0 ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-blue-800/50'}
                `}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                    aria-hidden="true"
                  />
                  <span className="text-white font-medium">{team.name}</span>
                  <span className="text-blue-400 text-xs">
                    ({team.playerIds.length} player{team.playerIds.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <span
                  className={`font-bold ${team.score >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  aria-label={`${team.name} has ${team.score} dollars`}
                >
                  ${team.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Players */}
      <div className="space-y-2">
        {isTeamMode && <h4 className="text-blue-300 text-sm mb-2">Players</h4>}
        {sortedPlayers.map((player, index) => {
          const isLeader = index === 0 && player.score > 0 && !isTeamMode;
          const teamColor = player.teamId ? getTeamColor(player.teamId) : null;

          return (
            <div
              key={player.id}
              className={`flex justify-between items-center px-3 py-2 rounded-lg
                ${isLeader ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-blue-800/50'}
                ${player.isSpectator ? 'opacity-50' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                {/* Team color indicator */}
                {teamColor && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: teamColor }}
                    aria-hidden="true"
                  />
                )}

                {/* Spectator badge */}
                {player.isSpectator && (
                  <span
                    className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded"
                    aria-label="Spectator"
                  >
                    SPECTATOR
                  </span>
                )}

                {/* Leader crown */}
                {isLeader && (
                  <span aria-label="Leader" className="text-yellow-400">
                    👑
                  </span>
                )}

                <span className="text-white font-medium">{player.name}</span>
              </div>

              {!player.isSpectator && (
                <span
                  className={`font-bold ${player.score >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  aria-label={`${player.name} has ${player.score} dollars`}
                >
                  ${player.score.toLocaleString()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {sortedPlayers.length === 0 && (
        <p className="text-blue-400 text-center py-4" role="status">
          No players yet
        </p>
      )}
    </div>
  );
}
