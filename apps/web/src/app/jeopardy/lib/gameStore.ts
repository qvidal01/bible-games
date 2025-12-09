// Zustand store for game state management
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  GameState,
  GameStatus,
  Player,
  Question,
  GameBoard,
  Category,
  Team,
  DailyDoubleState,
  FinalJeopardyState,
} from '../types/game';
import { getQuestionsForCategory, CATEGORY_DEFINITIONS, FINAL_JEOPARDY_QUESTIONS } from '../data/categories';

interface GameStore extends GameState {
  // Actions
  setRoomCode: (code: string) => void;
  setHostId: (id: string) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerScore: (playerId: string, score: number) => void;
  setStatus: (status: GameStatus) => void;
  setBoard: (board: GameBoard) => void;
  selectQuestion: (question: Question) => void;
  playerBuzz: (playerId: string, time: number) => void;
  resetBuzz: () => void;
  addWrongAnswerer: (playerId: string) => void;
  clearWrongAnswerers: () => void;
  markQuestionAnswered: (questionId: string, answeredBy?: string) => void;
  setSelectedCategories: (categories: string[]) => void;
  initializeBoard: (categoryIds: string[]) => void;
  resetGame: () => void;
  fullReset: () => void;
  updateGameState: (state: Partial<GameState>) => void;
  // Round management
  setRound: (round: 1 | 2) => void;
  startDoubleJeopardy: () => void;
  // Daily Double
  triggerDailyDouble: (question: Question, playerId: string) => void;
  setDailyDoubleWager: (wager: number) => void;
  resolveDailyDouble: (correct: boolean) => void;
  // Final Jeopardy
  startFinalJeopardy: () => void;
  setFinalJeopardyWager: (playerId: string, wager: number) => void;
  setFinalJeopardyAnswer: (playerId: string, answer: string) => void;
  revealFinalJeopardy: () => void;
  judgeFinalJeopardy: (playerId: string, correct: boolean) => void;
  // Team mode
  enableTeamMode: () => void;
  disableTeamMode: () => void;
  createTeam: (name: string, color: string) => Team;
  joinTeam: (playerId: string, teamId: string) => void;
  leaveTeam: (playerId: string) => void;
  updateTeamScore: (teamId: string, score: number) => void;
  // Spectator mode
  setSpectator: (playerId: string, isSpectator: boolean) => void;
  // Settings
  setTimerDuration: (duration: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
}

const initialState: Omit<GameState, 'updateGameState'> = {
  roomCode: '',
  status: 'lobby',
  players: [],
  hostId: '',
  board: null,
  currentQuestion: null,
  buzzedPlayer: null,
  buzzOrder: [],
  wrongAnswerers: [], // Track who answered wrong on current question
  round: 1,
  selectedCategories: [],
  isTeamMode: false,
  teams: [],
  dailyDoubleState: null,
  finalJeopardy: null,
  timerDuration: 10,
  soundEnabled: true,
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setRoomCode: (code) => set({ roomCode: code }),

    setHostId: (id) => set({ hostId: id }),

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
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, score } : p
        ),
      })),

    setStatus: (status) => set({ status }),

    setBoard: (board) => set({ board }),

    selectQuestion: (question) => {
      // Check if it's a Daily Double
      if (question.isDailyDouble) {
        const state = get();
        const lastBuzzer = state.buzzOrder[state.buzzOrder.length - 1];
        const playerId = lastBuzzer?.playerId || state.hostId;
        const player = state.players.find((p) => p.id === playerId);
        const maxWager = Math.max(player?.score || 0, state.round === 1 ? 1000 : 2000);

        set({
          currentQuestion: question,
          status: 'daily-double',
          buzzOrder: [],
          buzzedPlayer: null,
          wrongAnswerers: [], // Clear wrong answerers for new question
          dailyDoubleState: {
            question,
            playerId,
            wager: null,
            maxWager,
            answered: false,
          },
        });
      } else {
        set({
          currentQuestion: question,
          status: 'question',
          buzzOrder: [],
          buzzedPlayer: null,
          wrongAnswerers: [], // Clear wrong answerers for new question
        });
      }
    },

    playerBuzz: (playerId, time) =>
      set((state) => {
        const player = state.players.find((p) => p.id === playerId);
        const newBuzzOrder = [...state.buzzOrder, { playerId, time }].sort(
          (a, b) => a.time - b.time
        );

        // First buzzer wins
        const firstBuzzer = newBuzzOrder[0];
        const buzzedPlayer =
          state.players.find((p) => p.id === firstBuzzer.playerId) || null;

        return {
          buzzOrder: newBuzzOrder,
          buzzedPlayer: state.buzzedPlayer || buzzedPlayer,
          status: 'buzzing',
        };
      }),

    resetBuzz: () =>
      set({
        buzzOrder: [],
        buzzedPlayer: null,
        status: 'question',
      }),

    addWrongAnswerer: (playerId) =>
      set((state) => ({
        wrongAnswerers: [...state.wrongAnswerers, playerId],
      })),

    clearWrongAnswerers: () =>
      set({ wrongAnswerers: [] }),

    markQuestionAnswered: (questionId, answeredBy) =>
      set((state) => {
        if (!state.board) return state;

        const newBoard: GameBoard = {
          categories: state.board.categories.map((cat) => ({
            ...cat,
            questions: cat.questions.map((q) =>
              q.id === questionId ? { ...q, isAnswered: true, answeredBy } : q
            ),
          })),
        };

        // Check if all questions are answered
        const allAnswered = newBoard.categories.every((cat) =>
          cat.questions.every((q) => q.isAnswered)
        );

        // Determine next status
        let nextStatus: GameStatus = 'playing';
        if (allAnswered) {
          if (state.round === 1) {
            // Move to Double Jeopardy or Final Jeopardy
            nextStatus = 'playing'; // Will be changed by startDoubleJeopardy
          } else {
            // Round 2 finished, start Final Jeopardy
            nextStatus = 'final-jeopardy-wager';
          }
        }

        return {
          board: newBoard,
          currentQuestion: null,
          dailyDoubleState: null,
          status: allAnswered && state.round === 1 ? 'playing' : nextStatus,
        };
      }),

    setSelectedCategories: (categories) => set({ selectedCategories: categories }),

    initializeBoard: (categoryIds) => {
      const state = get();
      const multiplier = state.round === 2 ? 2 : 1;

      const categories: Category[] = categoryIds.map((catId) => {
        const catDef = CATEGORY_DEFINITIONS.find((c) => c.id === catId);
        const questions = getQuestionsForCategory(catId).map((q) => ({
          ...q,
          value: q.value * multiplier,
        }));
        return {
          id: catId,
          name: catDef?.name || catId,
          description: catDef?.description || '',
          questions,
        };
      });

      // Add Daily Doubles (1 for round 1, 2 for round 2)
      const dailyDoubleCount = state.round === 1 ? 1 : 2;
      const allQuestions = categories.flatMap((c) => c.questions);
      const eligibleQuestions = allQuestions.filter(
        (q) => q.value >= (state.round === 1 ? 600 : 1200)
      );

      // Randomly select Daily Double questions
      const shuffled = [...eligibleQuestions].sort(() => Math.random() - 0.5);
      const dailyDoubles = shuffled.slice(0, dailyDoubleCount);

      dailyDoubles.forEach((dd) => {
        dd.isDailyDouble = true;
      });

      set({
        board: { categories },
        status: 'playing',
        selectedCategories: categoryIds,
      });
    },

    resetGame: () =>
      set({
        ...initialState,
        roomCode: get().roomCode,
        players: get().players.map((p) => ({ ...p, score: 0 })),
        hostId: get().hostId,
        teams: get().teams.map((t) => ({ ...t, score: 0 })),
        isTeamMode: get().isTeamMode,
        timerDuration: get().timerDuration,
        soundEnabled: get().soundEnabled,
      }),

    // Complete reset - clears everything including players
    fullReset: () =>
      set({
        ...initialState,
      }),

    updateGameState: (newState) => set((state) => ({ ...state, ...newState })),

    // Round management
    setRound: (round) => set({ round }),

    startDoubleJeopardy: () => {
      const state = get();
      set({ round: 2, status: 'category-select', board: null });
    },

    // Daily Double
    triggerDailyDouble: (question, playerId) => {
      const state = get();
      const player = state.players.find((p) => p.id === playerId);
      const maxWager = Math.max(player?.score || 0, state.round === 1 ? 1000 : 2000);

      set({
        status: 'daily-double',
        currentQuestion: question,
        dailyDoubleState: {
          question,
          playerId,
          wager: null,
          maxWager,
          answered: false,
        },
      });
    },

    setDailyDoubleWager: (wager) =>
      set((state) => ({
        dailyDoubleState: state.dailyDoubleState
          ? { ...state.dailyDoubleState, wager }
          : null,
      })),

    resolveDailyDouble: (correct) =>
      set((state) => {
        if (!state.dailyDoubleState) return state;

        const { playerId, wager, question } = state.dailyDoubleState;
        const player = state.players.find((p) => p.id === playerId);
        if (!player || wager === null) return state;

        const pointChange = correct ? wager : -wager;
        const newScore = player.score + pointChange;

        return {
          players: state.players.map((p) =>
            p.id === playerId ? { ...p, score: newScore } : p
          ),
          dailyDoubleState: { ...state.dailyDoubleState, answered: true },
        };
      }),

    // Final Jeopardy
    startFinalJeopardy: () => {
      const randomQuestion =
        FINAL_JEOPARDY_QUESTIONS[
          Math.floor(Math.random() * FINAL_JEOPARDY_QUESTIONS.length)
        ];

      set({
        status: 'final-jeopardy-wager',
        finalJeopardy: {
          category: randomQuestion.category,
          question: randomQuestion.question,
          answer: randomQuestion.answer,
          wagers: {},
          answers: {},
          revealed: false,
          showAnswers: false,
        },
      });
    },

    setFinalJeopardyWager: (playerId, wager) =>
      set((state) => {
        if (!state.finalJeopardy) return state;
        return {
          finalJeopardy: {
            ...state.finalJeopardy,
            wagers: { ...state.finalJeopardy.wagers, [playerId]: wager },
          },
        };
      }),

    setFinalJeopardyAnswer: (playerId, answer) =>
      set((state) => {
        if (!state.finalJeopardy) return state;
        return {
          finalJeopardy: {
            ...state.finalJeopardy,
            answers: { ...state.finalJeopardy.answers, [playerId]: answer },
          },
        };
      }),

    revealFinalJeopardy: () =>
      set((state) => {
        if (!state.finalJeopardy) return state;
        return {
          status: 'final-jeopardy-reveal',
          finalJeopardy: {
            ...state.finalJeopardy,
            revealed: true,
            showAnswers: true,
          },
        };
      }),

    judgeFinalJeopardy: (playerId, correct) =>
      set((state) => {
        if (!state.finalJeopardy) return state;

        const wager = state.finalJeopardy.wagers[playerId] || 0;
        const player = state.players.find((p) => p.id === playerId);
        if (!player) return state;

        const pointChange = correct ? wager : -wager;
        const newScore = player.score + pointChange;

        return {
          players: state.players.map((p) =>
            p.id === playerId ? { ...p, score: newScore } : p
          ),
        };
      }),

    // Team mode
    enableTeamMode: () => set({ isTeamMode: true }),

    disableTeamMode: () =>
      set((state) => ({
        isTeamMode: false,
        teams: [],
        players: state.players.map((p) => ({ ...p, teamId: undefined })),
      })),

    createTeam: (name, color) => {
      const team: Team = {
        id: `team-${Date.now()}`,
        name,
        color,
        playerIds: [],
        score: 0,
      };
      set((state) => ({
        teams: [...state.teams, team],
      }));
      return team;
    },

    joinTeam: (playerId, teamId) =>
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, teamId } : p
        ),
        teams: state.teams.map((t) =>
          t.id === teamId
            ? { ...t, playerIds: [...t.playerIds.filter((id) => id !== playerId), playerId] }
            : { ...t, playerIds: t.playerIds.filter((id) => id !== playerId) }
        ),
      })),

    leaveTeam: (playerId) =>
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, teamId: undefined } : p
        ),
        teams: state.teams.map((t) => ({
          ...t,
          playerIds: t.playerIds.filter((id) => id !== playerId),
        })),
      })),

    updateTeamScore: (teamId, score) =>
      set((state) => ({
        teams: state.teams.map((t) =>
          t.id === teamId ? { ...t, score } : t
        ),
      })),

    // Spectator mode
    setSpectator: (playerId, isSpectator) =>
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, isSpectator } : p
        ),
      })),

    // Settings
    setTimerDuration: (duration) => set({ timerDuration: duration }),

    setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  }))
);

// Selective subscription hooks for performance
export const useGameStatus = () => useGameStore((state) => state.status);
export const usePlayers = () => useGameStore((state) => state.players);
export const useBoard = () => useGameStore((state) => state.board);
export const useCurrentQuestion = () => useGameStore((state) => state.currentQuestion);
export const useBuzzedPlayer = () => useGameStore((state) => state.buzzedPlayer);
export const useRound = () => useGameStore((state) => state.round);
export const useTeams = () => useGameStore((state) => state.teams);
export const useIsTeamMode = () => useGameStore((state) => state.isTeamMode);
export const useFinalJeopardy = () => useGameStore((state) => state.finalJeopardy);
export const useDailyDouble = () => useGameStore((state) => state.dailyDoubleState);
export const useTimerDuration = () => useGameStore((state) => state.timerDuration);
export const useSoundEnabled = () => useGameStore((state) => state.soundEnabled);
export const useWrongAnswerers = () => useGameStore((state) => state.wrongAnswerers);

// Generate a random room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
