// Pusher configuration for real-time multiplayer
import Pusher from 'pusher';
import PusherClient from 'pusher-js';

// Server-side Pusher instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  useTLS: true,
});

// Client-side Pusher instance (singleton)
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = (): PusherClient => {
  if (!pusherClientInstance && typeof window !== 'undefined') {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY || '',
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
        authEndpoint: '/api/pusher/auth',
      }
    );
  }
  return pusherClientInstance!;
};

// Channel naming convention
export const getGameChannel = (roomCode: string) => `presence-game-${roomCode}`;

// Shared event names (used by all games)
export const SHARED_EVENTS = {
  // Player events
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  PLAYER_BUZZED: 'player-buzzed',

  // Game flow events
  GAME_STARTED: 'game-started',
  GAME_STATE_UPDATE: 'game-state-update',
  GAME_ENDED: 'game-ended',

  // Host events
  HOST_HEARTBEAT: 'host-heartbeat',
  HOST_DISCONNECTED: 'host-disconnected',
  HOST_RECONNECTED: 'host-reconnected',
  HOST_TRANSFERRED: 'host-transferred',

  // State sync
  REQUEST_STATE_SYNC: 'request-state-sync',
  STATE_SYNC: 'state-sync',

  // Buzz mechanics
  BUZZ_RESET: 'buzz-reset',

  // Inactivity warnings
  INACTIVITY_WARNING: 'inactivity-warning',
  INACTIVITY_TIMEOUT: 'inactivity-timeout',
} as const;

// Jeopardy-specific events
export const JEOPARDY_EVENTS = {
  ...SHARED_EVENTS,
  QUESTION_SELECTED: 'question-selected',
  ANSWER_JUDGED: 'answer-judged',
  QUESTION_CLOSED: 'question-closed',
  REVEAL_ANSWER: 'reveal-answer',
  CATEGORIES_SELECTED: 'categories-selected',
  DAILY_DOUBLE: 'daily-double',
  FINAL_JEOPARDY: 'final-jeopardy',
} as const;

// Family Feud-specific events
export const FAMILY_FEUD_EVENTS = {
  ...SHARED_EVENTS,
  // Team events
  TEAM_JOINED: 'team-joined',
  TEAM_NAME_CHANGED: 'team-name-changed',
  // Game events
  FACE_OFF_START: 'face-off-start',
  FACE_OFF_BUZZ: 'face-off-buzz',
  FACE_OFF_WINNER: 'face-off-winner',
  ANSWER_REVEALED: 'answer-revealed',
  STRIKE: 'strike',
  STEAL_OPPORTUNITY: 'steal-opportunity',
  STEAL_RESULT: 'steal-result',
  ROUND_END: 'round-end',
  ROUND_POINTS_AWARDED: 'round-points-awarded',
  PLAY_OR_PASS: 'play-or-pass',
  NEXT_QUESTION: 'next-question',
} as const;

// Tic Tac Toe-specific events
export const TIC_TAC_TOE_EVENTS = {
  ...SHARED_EVENTS,
  // Game flow
  QUESTION_ASKED: 'question-asked',
  ANSWER_SUBMITTED: 'answer-submitted',
  ANSWER_JUDGED: 'answer-judged',
  CELL_CLAIMED: 'cell-claimed',
  TURN_CHANGED: 'turn-changed',
  ROUND_WON: 'round-won',
  ROUND_DRAW: 'round-draw',
  MATCH_WON: 'match-won',
  NEW_ROUND: 'new-round',
  TIMER_TICK: 'timer-tick',
  TIME_UP: 'time-up',
} as const;
