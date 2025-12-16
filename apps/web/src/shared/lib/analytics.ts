// PostHog Analytics Utility
import posthog from 'posthog-js';

// Check if PostHog is initialized
const isPostHogReady = () => {
  return typeof window !== 'undefined' && posthog.__loaded;
};

// Generic event capture with safety check
export const capture = (event: string, properties?: Record<string, unknown>) => {
  if (isPostHogReady()) {
    posthog.capture(event, properties);
  }
};

// ==================== Jeopardy Events ====================

export const trackJeopardyGameStarted = (data: {
  roomCode: string;
  playerCount: number;
  isTeamMode: boolean;
  categories: string[];
}) => {
  capture('jeopardy_game_started', {
    game_type: 'jeopardy',
    room_code: data.roomCode,
    player_count: data.playerCount,
    is_team_mode: data.isTeamMode,
    categories: data.categories,
  });
};

export const trackJeopardyQuestionSelected = (data: {
  roomCode: string;
  category: string;
  value: number;
  round: number;
  isDailyDouble: boolean;
}) => {
  capture('jeopardy_question_selected', {
    game_type: 'jeopardy',
    room_code: data.roomCode,
    category: data.category,
    question_value: data.value,
    round: data.round,
    is_daily_double: data.isDailyDouble,
  });
};

export const trackJeopardyBuzz = (data: {
  roomCode: string;
  playerName: string;
  buzzPosition: number;
}) => {
  capture('jeopardy_player_buzzed', {
    game_type: 'jeopardy',
    room_code: data.roomCode,
    player_name: data.playerName,
    buzz_position: data.buzzPosition,
  });
};

export const trackJeopardyAnswer = (data: {
  roomCode: string;
  playerName: string;
  correct: boolean;
  pointsChange: number;
  questionValue: number;
}) => {
  capture('jeopardy_question_answered', {
    game_type: 'jeopardy',
    room_code: data.roomCode,
    player_name: data.playerName,
    correct: data.correct,
    points_change: data.pointsChange,
    question_value: data.questionValue,
  });
};

export const trackJeopardyDailyDouble = (data: {
  roomCode: string;
  playerName: string;
  wager: number;
  correct: boolean;
  round: number;
}) => {
  capture('jeopardy_daily_double', {
    game_type: 'jeopardy',
    room_code: data.roomCode,
    player_name: data.playerName,
    wager: data.wager,
    correct: data.correct,
    round: data.round,
  });
};

export const trackJeopardyRoundComplete = (data: {
  roomCode: string;
  round: number;
  playerScores: { name: string; score: number }[];
}) => {
  capture('jeopardy_round_complete', {
    game_type: 'jeopardy',
    room_code: data.roomCode,
    round: data.round,
    player_scores: data.playerScores,
  });
};

export const trackJeopardyFinalJeopardy = (data: {
  roomCode: string;
  playerResults: { name: string; wager: number; correct: boolean; finalScore: number }[];
}) => {
  capture('jeopardy_final_jeopardy', {
    game_type: 'jeopardy',
    room_code: data.roomCode,
    player_results: data.playerResults,
  });
};

export const trackJeopardyGameFinished = (data: {
  roomCode: string;
  winner: string;
  finalScores: { name: string; score: number }[];
  totalRounds: number;
  gameDurationMinutes?: number;
}) => {
  capture('jeopardy_game_finished', {
    game_type: 'jeopardy',
    room_code: data.roomCode,
    winner: data.winner,
    final_scores: data.finalScores,
    total_rounds: data.totalRounds,
    game_duration_minutes: data.gameDurationMinutes,
  });
};

// ==================== Family Feud Events ====================

export const trackFamilyFeudGameStarted = (data: {
  roomCode: string;
  redTeamName: string;
  blueTeamName: string;
  redTeamPlayers: number;
  blueTeamPlayers: number;
  questionCount: number;
}) => {
  capture('family_feud_game_started', {
    game_type: 'family_feud',
    room_code: data.roomCode,
    red_team_name: data.redTeamName,
    blue_team_name: data.blueTeamName,
    red_team_players: data.redTeamPlayers,
    blue_team_players: data.blueTeamPlayers,
    question_count: data.questionCount,
  });
};

export const trackFamilyFeudFaceOff = (data: {
  roomCode: string;
  winningTeam: 'red' | 'blue';
  round: number;
}) => {
  capture('family_feud_face_off', {
    game_type: 'family_feud',
    room_code: data.roomCode,
    winning_team: data.winningTeam,
    round: data.round,
  });
};

export const trackFamilyFeudPlayOrPass = (data: {
  roomCode: string;
  team: 'red' | 'blue';
  decision: 'play' | 'pass';
  round: number;
}) => {
  capture('family_feud_play_or_pass', {
    game_type: 'family_feud',
    room_code: data.roomCode,
    team: data.team,
    decision: data.decision,
    round: data.round,
  });
};

export const trackFamilyFeudAnswerRevealed = (data: {
  roomCode: string;
  points: number;
  answerRank: number;
  round: number;
}) => {
  capture('family_feud_answer_revealed', {
    game_type: 'family_feud',
    room_code: data.roomCode,
    points: data.points,
    answer_rank: data.answerRank,
    round: data.round,
  });
};

export const trackFamilyFeudStrike = (data: {
  roomCode: string;
  team: 'red' | 'blue';
  strikeCount: number;
  round: number;
}) => {
  capture('family_feud_strike', {
    game_type: 'family_feud',
    room_code: data.roomCode,
    team: data.team,
    strike_count: data.strikeCount,
    round: data.round,
  });
};

export const trackFamilyFeudSteal = (data: {
  roomCode: string;
  stealingTeam: 'red' | 'blue';
  success: boolean;
  pointsAtStake: number;
  round: number;
}) => {
  capture('family_feud_steal_attempt', {
    game_type: 'family_feud',
    room_code: data.roomCode,
    stealing_team: data.stealingTeam,
    success: data.success,
    points_at_stake: data.pointsAtStake,
    round: data.round,
  });
};

export const trackFamilyFeudRoundComplete = (data: {
  roomCode: string;
  round: number;
  winningTeam: 'red' | 'blue';
  pointsAwarded: number;
  redTeamScore: number;
  blueTeamScore: number;
}) => {
  capture('family_feud_round_complete', {
    game_type: 'family_feud',
    room_code: data.roomCode,
    round: data.round,
    winning_team: data.winningTeam,
    points_awarded: data.pointsAwarded,
    red_team_score: data.redTeamScore,
    blue_team_score: data.blueTeamScore,
  });
};

export const trackFamilyFeudGameFinished = (data: {
  roomCode: string;
  winner: 'red' | 'blue';
  redTeamName: string;
  blueTeamName: string;
  redTeamScore: number;
  blueTeamScore: number;
  totalRounds: number;
  gameDurationMinutes?: number;
}) => {
  capture('family_feud_game_finished', {
    game_type: 'family_feud',
    room_code: data.roomCode,
    winner: data.winner,
    red_team_name: data.redTeamName,
    blue_team_name: data.blueTeamName,
    red_team_score: data.redTeamScore,
    blue_team_score: data.blueTeamScore,
    total_rounds: data.totalRounds,
    game_duration_minutes: data.gameDurationMinutes,
  });
};

// ==================== General Events ====================

export const trackRoomCreated = (data: {
  gameType: 'jeopardy' | 'family_feud';
  roomCode: string;
}) => {
  capture('room_created', {
    game_type: data.gameType,
    room_code: data.roomCode,
  });
};

export const trackRoomJoined = (data: {
  gameType: 'jeopardy' | 'family_feud';
  roomCode: string;
  playerName: string;
  isHost: boolean;
}) => {
  capture('room_joined', {
    game_type: data.gameType,
    room_code: data.roomCode,
    player_name: data.playerName,
    is_host: data.isHost,
  });
};

export const trackPlayerLeft = (data: {
  gameType: 'jeopardy' | 'family_feud';
  roomCode: string;
  playerName: string;
}) => {
  capture('player_left', {
    game_type: data.gameType,
    room_code: data.roomCode,
    player_name: data.playerName,
  });
};
