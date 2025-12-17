// Bible Go Fish - Zustand Game Store

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  GameState,
  GameStatus,
  Player,
  Card,
  CardSet,
  INITIAL_HAND_SIZE,
  CARDS_PER_SET,
} from '../types/game';
import { generateDeck, findCompleteSets } from '../data/cards';

interface GameStore extends GameState {
  // Room management
  setRoomCode: (code: string) => void;
  setHostId: (id: string) => void;

  // Player management
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerHand: (playerId: string, hand: Card[]) => void;
  addPlayerSet: (playerId: string, set: CardSet) => void;

  // Game flow
  setStatus: (status: GameStatus) => void;
  startGame: () => void;
  setCurrentPlayer: (index: number) => void;
  nextTurn: () => void;

  // Go Fish actions
  askForCategory: (category: string, targetPlayerId: string) => void;
  giveCards: (fromPlayerId: string, toPlayerId: string, category: string) => Card[];
  drawCard: (playerId: string) => Card | null;
  checkAndRemoveSets: (playerId: string) => CardSet[];
  setLastAction: (action: string | null) => void;

  // Game end
  checkGameOver: () => Player | null;

  // State sync
  updateGameState: (state: Partial<GameState>) => void;
  fullReset: () => void;
}

const initialState: GameState = {
  roomCode: '',
  status: 'lobby',
  players: [],
  hostId: '',
  deck: [],
  currentPlayerIndex: 0,
  lastAction: null,
  askedCategory: null,
  askedPlayerId: null,
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

    updatePlayerHand: (playerId, hand) =>
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, hand } : p
        ),
      })),

    addPlayerSet: (playerId, cardSet) =>
      set((state) => ({
        players: state.players.map((p) =>
          p.id === playerId ? { ...p, sets: [...p.sets, cardSet] } : p
        ),
      })),

    // Game flow
    setStatus: (status) => set({ status }),

    startGame: () => {
      const { players } = get();
      const deck = generateDeck();
      const handSize = players.length >= 4 ? 5 : INITIAL_HAND_SIZE;

      // Deal cards to each player
      let deckIndex = 0;
      const updatedPlayers = players.map((player) => {
        const hand = deck.slice(deckIndex, deckIndex + handSize);
        deckIndex += handSize;
        return { ...player, hand, sets: [] };
      });

      const remainingDeck = deck.slice(deckIndex);

      set({
        status: 'playing',
        players: updatedPlayers,
        deck: remainingDeck,
        currentPlayerIndex: 0,
        lastAction: null,
        askedCategory: null,
        askedPlayerId: null,
        winner: null,
      });
    },

    setCurrentPlayer: (index) => set({ currentPlayerIndex: index }),

    nextTurn: () =>
      set((state) => ({
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
        askedCategory: null,
        askedPlayerId: null,
      })),

    // Go Fish actions
    askForCategory: (category, targetPlayerId) =>
      set({
        status: 'asking',
        askedCategory: category,
        askedPlayerId: targetPlayerId,
      }),

    giveCards: (fromPlayerId, toPlayerId, category) => {
      const { players } = get();
      const fromPlayer = players.find((p) => p.id === fromPlayerId);
      const toPlayer = players.find((p) => p.id === toPlayerId);

      if (!fromPlayer || !toPlayer) return [];

      const cardsToGive = fromPlayer.hand.filter((c) => c.category === category);
      const remainingHand = fromPlayer.hand.filter((c) => c.category !== category);

      set({
        players: players.map((p) => {
          if (p.id === fromPlayerId) {
            return { ...p, hand: remainingHand };
          }
          if (p.id === toPlayerId) {
            return { ...p, hand: [...p.hand, ...cardsToGive] };
          }
          return p;
        }),
      });

      return cardsToGive;
    },

    drawCard: (playerId) => {
      const { deck, players } = get();
      if (deck.length === 0) return null;

      const [drawnCard, ...remainingDeck] = deck;

      set({
        deck: remainingDeck,
        players: players.map((p) =>
          p.id === playerId ? { ...p, hand: [...p.hand, drawnCard] } : p
        ),
      });

      return drawnCard;
    },

    checkAndRemoveSets: (playerId) => {
      const { players } = get();
      const player = players.find((p) => p.id === playerId);
      if (!player) return [];

      const completeSets = findCompleteSets(player.hand);
      if (completeSets.length === 0) return [];

      // Remove set cards from hand and add to sets
      const setCardIds = new Set(completeSets.flatMap((s) => s.cards.map((c) => c.id)));
      const newHand = player.hand.filter((c) => !setCardIds.has(c.id));
      const newSets: CardSet[] = completeSets.map((s) => ({
        category: s.category,
        cards: s.cards,
        completedBy: playerId,
      }));

      set({
        players: players.map((p) =>
          p.id === playerId
            ? { ...p, hand: newHand, sets: [...p.sets, ...newSets] }
            : p
        ),
      });

      return newSets;
    },

    setLastAction: (action) => set({ lastAction: action }),

    // Game end
    checkGameOver: () => {
      const { players, deck } = get();

      // Game is over when deck is empty and at least one player has no cards
      const hasEmptyHand = players.some((p) => p.hand.length === 0);
      if (deck.length === 0 && hasEmptyHand) {
        // Winner is player with most sets
        const winner = players.reduce((prev, curr) =>
          curr.sets.length > prev.sets.length ? curr : prev
        );
        set({ winner, status: 'finished' });
        return winner;
      }

      // Also check if all sets have been collected (32 cards = 8 sets)
      const totalSets = players.reduce((sum, p) => sum + p.sets.length, 0);
      if (totalSets === 8) {
        const winner = players.reduce((prev, curr) =>
          curr.sets.length > prev.sets.length ? curr : prev
        );
        set({ winner, status: 'finished' });
        return winner;
      }

      return null;
    },

    // State sync
    updateGameState: (newState) => set((state) => ({ ...state, ...newState })),

    fullReset: () => set({ ...initialState }),
  }))
);

// Selective subscription hooks
export const useGameStatus = () => useGameStore((state) => state.status);
export const usePlayers = () => useGameStore((state) => state.players);
export const useCurrentPlayer = () =>
  useGameStore((state) => state.players[state.currentPlayerIndex]);
export const useDeck = () => useGameStore((state) => state.deck);
export const useWinner = () => useGameStore((state) => state.winner);
