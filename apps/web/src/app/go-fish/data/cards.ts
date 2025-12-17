// Bible Go Fish - Card Categories and Characters

import { Card, CardCategory } from '../types/game';

export const CATEGORIES: CardCategory[] = [
  {
    name: 'Prophets',
    emoji: '📜',
    characters: [
      { name: 'Isaiah', emoji: '📖' },
      { name: 'Jeremiah', emoji: '😢' },
      { name: 'Ezekiel', emoji: '👁️' },
      { name: 'Daniel', emoji: '🦁' },
    ],
  },
  {
    name: 'Apostles',
    emoji: '✝️',
    characters: [
      { name: 'Peter', emoji: '🔑' },
      { name: 'John', emoji: '❤️' },
      { name: 'Paul', emoji: '⚔️' },
      { name: 'James', emoji: '📝' },
    ],
  },
  {
    name: 'Kings',
    emoji: '👑',
    characters: [
      { name: 'David', emoji: '🎵' },
      { name: 'Solomon', emoji: '🏛️' },
      { name: 'Saul', emoji: '🗡️' },
      { name: 'Hezekiah', emoji: '🙏' },
    ],
  },
  {
    name: 'Women of Faith',
    emoji: '👩',
    characters: [
      { name: 'Ruth', emoji: '🌾' },
      { name: 'Esther', emoji: '👸' },
      { name: 'Mary', emoji: '💙' },
      { name: 'Sarah', emoji: '👵' },
    ],
  },
  {
    name: 'Patriarchs',
    emoji: '👴',
    characters: [
      { name: 'Abraham', emoji: '⭐' },
      { name: 'Isaac', emoji: '🐑' },
      { name: 'Jacob', emoji: '🪜' },
      { name: 'Joseph', emoji: '🧥' },
    ],
  },
  {
    name: 'Judges',
    emoji: '⚖️',
    characters: [
      { name: 'Samson', emoji: '💪' },
      { name: 'Gideon', emoji: '🏺' },
      { name: 'Deborah', emoji: '🌴' },
      { name: 'Samuel', emoji: '👂' },
    ],
  },
  {
    name: 'Gospel Writers',
    emoji: '📚',
    characters: [
      { name: 'Matthew', emoji: '💰' },
      { name: 'Mark', emoji: '🦁' },
      { name: 'Luke', emoji: '⚕️' },
      { name: 'John', emoji: '🦅' },
    ],
  },
  {
    name: 'Helpers',
    emoji: '🤝',
    characters: [
      { name: 'Timothy', emoji: '📖' },
      { name: 'Titus', emoji: '🏝️' },
      { name: 'Barnabas', emoji: '💪' },
      { name: 'Silas', emoji: '⛓️' },
    ],
  },
];

// Generate a full deck of cards
export function generateDeck(): Card[] {
  const deck: Card[] = [];
  let cardId = 0;

  for (const category of CATEGORIES) {
    for (const character of category.characters) {
      deck.push({
        id: `card-${cardId++}`,
        category: category.name,
        character: character.name,
        emoji: character.emoji,
      });
    }
  }

  return shuffleDeck(deck);
}

// Fisher-Yates shuffle
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Get category info
export function getCategoryInfo(categoryName: string): CardCategory | undefined {
  return CATEGORIES.find((c) => c.name === categoryName);
}

// Get all unique categories in a hand
export function getCategoriesInHand(hand: Card[]): string[] {
  return [...new Set(hand.map((card) => card.category))];
}

// Count cards of a category in hand
export function countCardsInCategory(hand: Card[], category: string): number {
  return hand.filter((card) => card.category === category).length;
}

// Check if hand has a complete set (4 cards of same category)
export function findCompleteSets(hand: Card[]): { category: string; cards: Card[] }[] {
  const sets: { category: string; cards: Card[] }[] = [];
  const categoryGroups: Record<string, Card[]> = {};

  for (const card of hand) {
    if (!categoryGroups[card.category]) {
      categoryGroups[card.category] = [];
    }
    categoryGroups[card.category].push(card);
  }

  for (const [category, cards] of Object.entries(categoryGroups)) {
    if (cards.length === 4) {
      sets.push({ category, cards });
    }
  }

  return sets;
}
