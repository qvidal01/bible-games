import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  KidsTriviaGameState,
  KidsTriviaPlayer,
  KidsTriviaRound,
  KidsTriviaSettings,
  KidsTriviaStatus,
} from '../types/game';

type GameStore = KidsTriviaGameState & {
  setRoomCode: (roomCode: string) => void;
  setHostId: (hostId: string) => void;
  setStatus: (status: KidsTriviaStatus) => void;
  setSettings: (settings: Partial<KidsTriviaSettings>) => void;
  addPlayer: (player: KidsTriviaPlayer) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerScore: (playerId: string, score: number) => void;
  startRound: (round: KidsTriviaRound) => void;
  addUsedQuestionId: (questionId: string) => void;
  submitAnswer: (playerId: string, answer: string) => void;
  closeRound: (params: { winnerPlayerId: string | null; closedAt?: number }) => void;
  revealAnswer: (winnerPlayerId: string | null, revealedAt?: number) => void;
  applySyncedState: (state: Partial<KidsTriviaGameState>) => void;
  fullReset: () => void;
};

const defaultSettings: KidsTriviaSettings = {
  difficulty: 'easy',
  timerSeconds: 12,
  hintDelaySeconds: 5,
  autoShowHint: true,
  hostRevealOnly: false,
  maxRounds: 10,
  points: {
    easy: 10,
    medium: 15,
    hard: 20,
  },
};

const initialState: KidsTriviaGameState = {
  roomCode: '',
  hostId: '',
  status: 'lobby',
  players: [],
  settings: defaultSettings,
  round: null,
  usedQuestionIds: [],
};

export const useKidsTriviaStore = create<GameStore>()(
  subscribeWithSelector((set) => ({
    ...initialState,

    setRoomCode: (roomCode) => set({ roomCode }),
    setHostId: (hostId) => set({ hostId }),
    setStatus: (status) => set({ status }),

    setSettings: (settings) =>
      set((state) => ({
        settings: {
          ...state.settings,
          ...settings,
          points: settings.points ? { ...state.settings.points, ...settings.points } : state.settings.points,
        },
      })),

    addPlayer: (player) =>
      set((state) => ({
        players: [...state.players.filter((p) => p.id !== player.id), player],
      })),

    removePlayer: (playerId) =>
      set((state) => ({
        players: state.players.filter((p) => p.id !== playerId),
      })),

    updatePlayerScore: (playerId, score) =>
      set((state) => ({
        players: state.players.map((p) => (p.id === playerId ? { ...p, score } : p)),
      })),

    startRound: (round) => set({ round, status: 'playing' }),

    addUsedQuestionId: (questionId) =>
      set((state) => ({
        usedQuestionIds: state.usedQuestionIds.includes(questionId)
          ? state.usedQuestionIds
          : [...state.usedQuestionIds, questionId].slice(-50),
      })),

    submitAnswer: (playerId, answer) =>
      set((state) => {
        if (!state.round) return state;
        if (state.round.closedAt) return state;
        if (state.round.answersByPlayerId[playerId]) return state;
        return {
          round: {
            ...state.round,
            answersByPlayerId: { ...state.round.answersByPlayerId, [playerId]: answer },
          },
        };
      }),

    closeRound: ({ winnerPlayerId, closedAt = Date.now() }) =>
      set((state) => {
        if (!state.round) return state;
        if (state.round.closedAt) return state;
        return {
          round: {
            ...state.round,
            winnerPlayerId,
            closedAt,
          },
        };
      }),

    revealAnswer: (winnerPlayerId, revealedAt = Date.now()) =>
      set((state) => {
        if (!state.round) return state;
        return {
          status: 'reveal',
          round: {
            ...state.round,
            winnerPlayerId,
            closedAt: state.round.closedAt ?? revealedAt,
            revealedAt,
          },
        };
      }),

    applySyncedState: (synced) =>
      set((state) => ({
        ...state,
        ...synced,
        settings: synced.settings ? { ...state.settings, ...synced.settings } : state.settings,
        players: synced.players ?? state.players,
        usedQuestionIds: synced.usedQuestionIds ?? state.usedQuestionIds,
        round: synced.round ?? state.round,
      })),

    fullReset: () => set({ ...initialState }),
  })),
);

export function createRound(params: { index: number; questionId: string; startedAt?: number }): KidsTriviaRound {
  return {
    index: params.index,
    questionId: params.questionId,
    startedAt: params.startedAt ?? Date.now(),
    closedAt: null,
    revealedAt: null,
    winnerPlayerId: null,
    answersByPlayerId: {},
  };
}
