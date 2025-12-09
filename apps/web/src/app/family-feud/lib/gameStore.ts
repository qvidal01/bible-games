// Zustand store for Bible Family Feud game state
import { create } from 'zustand';
import { GameState, Player, Team, SurveyQuestion } from '../types/game';
import { getRandomQuestions } from '../data/surveys';

interface GameStore extends GameState {
  // Actions
  setRoomCode: (code: string) => void;
  setHostId: (id: string) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  clearAllPlayers: () => void;
  joinTeam: (playerId: string, teamId: 'red' | 'blue') => void;
  setTeamName: (teamId: 'red' | 'blue', name: string) => void;
  setCaptain: (playerId: string, teamId: 'red' | 'blue') => void;
  setStatus: (status: GameState['status']) => void;
  startGame: (questionCount?: number) => void;
  faceOffBuzz: (teamId: 'red' | 'blue') => void;
  setFaceOffWinner: (winner: 'red' | 'blue') => void;
  playOrPass: (decision: 'play' | 'pass') => void;
  revealAnswer: (answerId: string) => void;
  addStrike: () => void;
  resetStrikes: () => void;
  attemptSteal: (success: boolean) => void;
  awardRoundPoints: (teamId: 'red' | 'blue') => void;
  nextQuestion: () => void;
  resetGame: () => void;
  fullReset: () => void;
  updateGameState: (state: Partial<GameState>) => void;
}

const createInitialTeam = (id: 'red' | 'blue', name: string): Team => ({
  id,
  name,
  score: 0,
  players: [],
  strikes: 0,
  color: id,
});

const initialState: Omit<GameState, 'updateGameState'> = {
  roomCode: '',
  status: 'lobby',
  players: [],
  teams: {
    red: createInitialTeam('red', 'Red Team'),
    blue: createInitialTeam('blue', 'Blue Team'),
  },
  hostId: '',
  currentQuestion: null,
  questionIndex: 0,
  questions: [],
  controllingTeam: null,
  faceOffWinner: null,
  currentAnsweringTeam: null,
  roundPoints: 0,
  round: 1,
  maxRounds: 5,
  faceOffBuzzed: null,
  lastRevealedAnswer: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setRoomCode: (code) => set({ roomCode: code }),

  setHostId: (id) => set({ hostId: id }),

  addPlayer: (player) => set((state) => ({
    players: [...state.players.filter(p => p.id !== player.id), player]
  })),

  removePlayer: (playerId) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    const newPlayers = state.players.filter(p => p.id !== playerId);

    // Remove from team if assigned
    const newTeams = { ...state.teams };
    if (player?.teamId) {
      newTeams[player.teamId] = {
        ...newTeams[player.teamId],
        players: newTeams[player.teamId].players.filter(id => id !== playerId)
      };
    }

    return { players: newPlayers, teams: newTeams };
  }),

  clearAllPlayers: () => set((state) => ({
    players: [],
    teams: {
      red: { ...state.teams.red, players: [] },
      blue: { ...state.teams.blue, players: [] },
    },
  })),

  joinTeam: (playerId, teamId) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return state;

    // Remove from previous team if any
    const newTeams = { ...state.teams };
    if (player.teamId && player.teamId !== teamId) {
      newTeams[player.teamId] = {
        ...newTeams[player.teamId],
        players: newTeams[player.teamId].players.filter(id => id !== playerId)
      };
    }

    // Add to new team
    if (!newTeams[teamId].players.includes(playerId)) {
      newTeams[teamId] = {
        ...newTeams[teamId],
        players: [...newTeams[teamId].players, playerId]
      };
    }

    // Update player's teamId
    const newPlayers = state.players.map(p =>
      p.id === playerId ? { ...p, teamId, isCaptain: false } : p
    );

    return { players: newPlayers, teams: newTeams };
  }),

  setTeamName: (teamId, name) => set((state) => ({
    teams: {
      ...state.teams,
      [teamId]: { ...state.teams[teamId], name }
    }
  })),

  setCaptain: (playerId, teamId) => set((state) => ({
    players: state.players.map(p => ({
      ...p,
      isCaptain: p.id === playerId && p.teamId === teamId
    }))
  })),

  setStatus: (status) => set({ status }),

  startGame: (questionCount = 5) => {
    const questions = getRandomQuestions(questionCount);
    set({
      questions,
      currentQuestion: questions[0] || null,
      questionIndex: 0,
      status: 'face-off',
      round: 1,
      maxRounds: questionCount,
      teams: {
        red: { ...get().teams.red, strikes: 0 },
        blue: { ...get().teams.blue, strikes: 0 },
      },
      roundPoints: 0,
      faceOffBuzzed: null,
      faceOffWinner: null,
      controllingTeam: null,
    });
  },

  faceOffBuzz: (teamId) => set((state) => {
    // Only first buzz counts
    if (state.faceOffBuzzed) return state;
    return {
      faceOffBuzzed: { teamId, time: Date.now() },
      faceOffWinner: teamId,
    };
  }),

  setFaceOffWinner: (winner) => set({
    faceOffWinner: winner,
    controllingTeam: winner,
    currentAnsweringTeam: winner,
  }),

  playOrPass: (decision) => set((state) => {
    const winner = state.faceOffWinner;
    if (!winner) return state;

    // If pass, control goes to other team
    const controllingTeam = decision === 'play' ? winner : (winner === 'red' ? 'blue' : 'red');

    return {
      status: 'playing',
      controllingTeam,
      currentAnsweringTeam: controllingTeam,
      teams: {
        ...state.teams,
        red: { ...state.teams.red, strikes: 0 },
        blue: { ...state.teams.blue, strikes: 0 },
      },
    };
  }),

  revealAnswer: (answerId) => set((state) => {
    if (!state.currentQuestion) return state;

    const updatedAnswers = state.currentQuestion.answers.map(a =>
      a.id === answerId ? { ...a, revealed: true } : a
    );

    const revealedAnswer = updatedAnswers.find(a => a.id === answerId);
    const newRoundPoints = state.roundPoints + (revealedAnswer?.points || 0);

    // Check if all answers revealed
    const allRevealed = updatedAnswers.every(a => a.revealed);

    return {
      currentQuestion: {
        ...state.currentQuestion,
        answers: updatedAnswers,
      },
      roundPoints: newRoundPoints,
      lastRevealedAnswer: revealedAnswer || null,
      status: allRevealed ? 'round-end' : state.status,
    };
  }),

  addStrike: () => set((state) => {
    const teamId = state.controllingTeam;
    if (!teamId) return state;

    const newStrikes = state.teams[teamId].strikes + 1;
    const newTeams = {
      ...state.teams,
      [teamId]: { ...state.teams[teamId], strikes: newStrikes }
    };

    // 3 strikes - other team can steal
    if (newStrikes >= 3) {
      const otherTeam = teamId === 'red' ? 'blue' : 'red';
      return {
        teams: newTeams,
        status: 'steal',
        currentAnsweringTeam: otherTeam,
      };
    }

    return { teams: newTeams };
  }),

  resetStrikes: () => set((state) => ({
    teams: {
      red: { ...state.teams.red, strikes: 0 },
      blue: { ...state.teams.blue, strikes: 0 },
    }
  })),

  attemptSteal: (success) => set((state) => {
    const stealingTeam = state.currentAnsweringTeam;
    const originalTeam = state.controllingTeam;

    if (!stealingTeam || !originalTeam) return state;

    // If steal successful, stealing team gets all points
    // If failed, original team keeps points
    const winningTeam = success ? stealingTeam : originalTeam;

    return {
      teams: {
        ...state.teams,
        [winningTeam]: {
          ...state.teams[winningTeam],
          score: state.teams[winningTeam].score + state.roundPoints
        }
      },
      status: 'round-end',
    };
  }),

  awardRoundPoints: (teamId) => set((state) => ({
    teams: {
      ...state.teams,
      [teamId]: {
        ...state.teams[teamId],
        score: state.teams[teamId].score + state.roundPoints
      }
    },
    status: 'round-end',
  })),

  nextQuestion: () => set((state) => {
    const nextIndex = state.questionIndex + 1;

    if (nextIndex >= state.questions.length) {
      // Game over
      return { status: 'finished' };
    }

    return {
      currentQuestion: state.questions[nextIndex],
      questionIndex: nextIndex,
      round: nextIndex + 1,
      status: 'face-off',
      roundPoints: 0,
      faceOffBuzzed: null,
      faceOffWinner: null,
      controllingTeam: null,
      currentAnsweringTeam: null,
      lastRevealedAnswer: null,
      teams: {
        red: { ...state.teams.red, strikes: 0 },
        blue: { ...state.teams.blue, strikes: 0 },
      },
    };
  }),

  resetGame: () => set({
    ...initialState,
    roomCode: get().roomCode,
    players: get().players.map(p => ({ ...p, teamId: null, isCaptain: false })),
    hostId: get().hostId,
    teams: {
      red: createInitialTeam('red', get().teams.red.name),
      blue: createInitialTeam('blue', get().teams.blue.name),
    },
  }),

  // Full reset clears everything including all players
  fullReset: () => set({
    ...initialState,
    teams: {
      red: createInitialTeam('red', 'Red Team'),
      blue: createInitialTeam('blue', 'Blue Team'),
    },
  }),

  updateGameState: (newState) => set((state) => ({ ...state, ...newState })),
}));

// Generate a random room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
