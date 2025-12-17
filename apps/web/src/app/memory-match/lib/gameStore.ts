// Bible Memory Match - Zustand Game Store

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  GameState,
  GameStatus,
  Player,
  Card,
  GridSize,
} from '../types/game';
import { generateCards, checkMatch } from '../data/characters';

interface GameStore extends GameState {
  // Room management
  setRoomCode: (code: string) => void;
  setHostId: (id: string) => void;

  // Player management
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerScore: (playerId: string, score: number) => void;

  // Game flow
  setStatus: (status: GameStatus) => void;
  startGame: (gridSize: GridSize) => void;
  flipCard: (cardIndex: number) => void;
  checkForMatch: () => { matched: boolean; cardIndices: [number, number] };
  resetFlippedCards: () => void;
  nextTurn: () => void;
  checkGameOver: () => boolean;

  // Settings
  setGridSize: (size: GridSize) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setShowHints: (show: boolean) => void;

  // State sync
  updateGameState: (state: Partial<GameState>) => void;
  fullReset: () => void;

  // Internal
  gridSize: GridSize;
}

const initialState: Omit<GameState, 'gridSize'> & { gridSize: GridSize } = {
  roomCode: '',
  status: 'lobby',
  players: [],
  hostId: '',
  cards: [],
  gridSize: '4x4',
  currentPlayerIndex: 0,
  firstCard: null,
  secondCard: null,
  soundEnabled: true,
  showHints: true,
  winner: null,
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Room management
    setRoomCode: (code) => set({ roomCode: code }),
    setHostId: (id) => set({ hostId: id }),

    // Player management
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

    // Game flow
    setStatus: (status) => set({ status }),

    startGame: (gridSize) => {
      const cards = generateCards(gridSize);
      set({
        status: 'playing',
        cards,
        gridSize,
        currentPlayerIndex: 0,
        firstCard: null,
        secondCard: null,
        winner: null,
        players: get().players.map((p) => ({ ...p, score: 0 })),
      });
    },

    flipCard: (cardIndex) => {
      const { cards, firstCard, secondCard, status } = get();

      // Can't flip if not playing or card already flipped/matched
      if (status !== 'playing') return;
      if (cards[cardIndex].isFlipped || cards[cardIndex].isMatched) return;
      if (firstCard !== null && secondCard !== null) return;

      const newCards = [...cards];
      newCards[cardIndex] = { ...newCards[cardIndex], isFlipped: true };

      if (firstCard === null) {
        set({ cards: newCards, firstCard: cardIndex });
      } else {
        set({ cards: newCards, secondCard: cardIndex, status: 'checking' });
      }
    },

    checkForMatch: () => {
      const { cards, firstCard, secondCard, players, currentPlayerIndex } = get();

      if (firstCard === null || secondCard === null) {
        return { matched: false, cardIndices: [-1, -1] as [number, number] };
      }

      const matched = checkMatch(cards, firstCard, secondCard);
      const currentPlayer = players[currentPlayerIndex];

      if (matched) {
        // Mark cards as matched
        const newCards = [...cards];
        newCards[firstCard] = {
          ...newCards[firstCard],
          isMatched: true,
          matchedBy: currentPlayer.id,
        };
        newCards[secondCard] = {
          ...newCards[secondCard],
          isMatched: true,
          matchedBy: currentPlayer.id,
        };

        // Update player score
        const newPlayers = players.map((p) =>
          p.id === currentPlayer.id ? { ...p, score: p.score + 1 } : p
        );

        set({
          cards: newCards,
          players: newPlayers,
          firstCard: null,
          secondCard: null,
          status: 'playing',
        });
      }

      return { matched, cardIndices: [firstCard, secondCard] as [number, number] };
    },

    resetFlippedCards: () => {
      const { cards, firstCard, secondCard } = get();

      if (firstCard === null || secondCard === null) return;

      const newCards = [...cards];
      newCards[firstCard] = { ...newCards[firstCard], isFlipped: false };
      newCards[secondCard] = { ...newCards[secondCard], isFlipped: false };

      set({
        cards: newCards,
        firstCard: null,
        secondCard: null,
        status: 'playing',
      });
    },

    nextTurn: () => {
      const { players, currentPlayerIndex } = get();
      const nextIndex = (currentPlayerIndex + 1) % players.length;
      set({ currentPlayerIndex: nextIndex });
    },

    checkGameOver: () => {
      const { cards, players } = get();
      const allMatched = cards.every((card) => card.isMatched);

      if (allMatched) {
        // Find winner (highest score)
        const winner = players.reduce((prev, current) =>
          current.score > prev.score ? current : prev
        );

        set({ status: 'finished', winner });
        return true;
      }

      return false;
    },

    // Settings
    setGridSize: (size) => set({ gridSize: size }),
    setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
    setShowHints: (show) => set({ showHints: show }),

    // State sync
    updateGameState: (newState) => set((state) => ({ ...state, ...newState })),

    fullReset: () => set(initialState),
  }))
);

// Selective subscription hooks
export const useGameStatus = () => useGameStore((state) => state.status);
export const usePlayers = () => useGameStore((state) => state.players);
export const useCards = () => useGameStore((state) => state.cards);
export const useCurrentPlayer = () =>
  useGameStore((state) => state.players[state.currentPlayerIndex]);
export const useWinner = () => useGameStore((state) => state.winner);
