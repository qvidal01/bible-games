// Bible Memory Match - Character Data
// Fun Bible characters for kids to learn and match!

import { BibleCharacter, Card, GridSize, GRID_CONFIGS } from '../types/game';

export const BIBLE_CHARACTERS: BibleCharacter[] = [
  // Old Testament Heroes
  { id: 'adam', name: 'Adam', emoji: '👨', description: 'The first man', color: 'bg-green-500' },
  { id: 'eve', name: 'Eve', emoji: '👩', description: 'The first woman', color: 'bg-pink-500' },
  { id: 'noah', name: 'Noah', emoji: '🚢', description: 'Built the ark', color: 'bg-blue-500' },
  { id: 'abraham', name: 'Abraham', emoji: '⭐', description: 'Father of many nations', color: 'bg-yellow-500' },
  { id: 'sarah', name: 'Sarah', emoji: '👵', description: "Abraham's wife", color: 'bg-purple-500' },
  { id: 'isaac', name: 'Isaac', emoji: '🐑', description: 'Son of Abraham', color: 'bg-amber-500' },
  { id: 'jacob', name: 'Jacob', emoji: '🪜', description: 'Had 12 sons', color: 'bg-indigo-500' },
  { id: 'joseph', name: 'Joseph', emoji: '🧥', description: 'Had a colorful coat', color: 'bg-orange-500' },
  { id: 'moses', name: 'Moses', emoji: '🏔️', description: 'Led Israel from Egypt', color: 'bg-stone-500' },
  { id: 'miriam', name: 'Miriam', emoji: '🎵', description: "Moses' sister", color: 'bg-rose-500' },
  { id: 'joshua', name: 'Joshua', emoji: '🎺', description: 'Walls of Jericho', color: 'bg-red-500' },
  { id: 'ruth', name: 'Ruth', emoji: '🌾', description: 'Loyal daughter-in-law', color: 'bg-amber-600' },
  { id: 'samuel', name: 'Samuel', emoji: '👂', description: 'Heard God call', color: 'bg-cyan-500' },
  { id: 'david', name: 'David', emoji: '👑', description: 'Shepherd king', color: 'bg-yellow-600' },
  { id: 'goliath', name: 'Goliath', emoji: '🗡️', description: 'Giant warrior', color: 'bg-gray-600' },
  { id: 'solomon', name: 'Solomon', emoji: '📜', description: 'Wisest king', color: 'bg-violet-500' },
  { id: 'elijah', name: 'Elijah', emoji: '🔥', description: 'Prophet of fire', color: 'bg-orange-600' },
  { id: 'elisha', name: 'Elisha', emoji: '🧸', description: "Elijah's helper", color: 'bg-teal-500' },
  { id: 'jonah', name: 'Jonah', emoji: '🐋', description: 'Inside a big fish', color: 'bg-blue-600' },
  { id: 'daniel', name: 'Daniel', emoji: '🦁', description: "In the lions' den", color: 'bg-amber-700' },
  { id: 'esther', name: 'Esther', emoji: '👸', description: 'Brave queen', color: 'bg-fuchsia-500' },

  // New Testament
  { id: 'mary', name: 'Mary', emoji: '💙', description: "Jesus' mother", color: 'bg-sky-500' },
  { id: 'joseph-nt', name: 'Joseph', emoji: '🔨', description: "Jesus' earthly father", color: 'bg-stone-600' },
  { id: 'jesus', name: 'Jesus', emoji: '✝️', description: 'Son of God', color: 'bg-white' },
  { id: 'john-baptist', name: 'John', emoji: '💧', description: 'Baptized Jesus', color: 'bg-blue-400' },
  { id: 'peter', name: 'Peter', emoji: '🎣', description: 'Fisherman apostle', color: 'bg-slate-500' },
  { id: 'paul', name: 'Paul', emoji: '✉️', description: 'Wrote many letters', color: 'bg-emerald-500' },
  { id: 'martha', name: 'Martha', emoji: '🏠', description: 'Hardworking hostess', color: 'bg-lime-500' },
  { id: 'lazarus', name: 'Lazarus', emoji: '🙏', description: 'Jesus raised him', color: 'bg-zinc-500' },
  { id: 'zacchaeus', name: 'Zacchaeus', emoji: '🌳', description: 'Climbed a tree', color: 'bg-green-600' },

  // Animals & Objects (for variety and fun)
  { id: 'dove', name: 'Dove', emoji: '🕊️', description: "Noah's bird", color: 'bg-gray-300' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', description: "God's promise", color: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500' },
  { id: 'lamb', name: 'Lamb', emoji: '🐑', description: 'Symbol of Jesus', color: 'bg-neutral-200' },
  { id: 'fish', name: 'Fish', emoji: '🐟', description: 'Christian symbol', color: 'bg-cyan-400' },
  { id: 'bread', name: 'Bread', emoji: '🍞', description: 'Bread of life', color: 'bg-amber-300' },
  { id: 'crown', name: 'Crown', emoji: '👑', description: "King's crown", color: 'bg-yellow-400' },
];

// Get a character by ID
export const getCharacter = (id: string): BibleCharacter | undefined => {
  return BIBLE_CHARACTERS.find((c) => c.id === id);
};

// Generate shuffled cards for the game
export const generateCards = (gridSize: GridSize): Card[] => {
  const { pairs } = GRID_CONFIGS[gridSize];

  // Select random characters for the pairs needed
  const shuffledCharacters = [...BIBLE_CHARACTERS].sort(() => Math.random() - 0.5);
  const selectedCharacters = shuffledCharacters.slice(0, pairs);

  // Create pairs of cards
  const cards: Card[] = [];
  let cardId = 0;

  selectedCharacters.forEach((character) => {
    // Create two cards for each character (a pair)
    cards.push({
      id: `card-${cardId++}`,
      characterId: character.id,
      isFlipped: false,
      isMatched: false,
    });
    cards.push({
      id: `card-${cardId++}`,
      characterId: character.id,
      isFlipped: false,
      isMatched: false,
    });
  });

  // Shuffle the cards
  return cards.sort(() => Math.random() - 0.5);
};

// Check if two cards match
export const checkMatch = (cards: Card[], index1: number, index2: number): boolean => {
  return cards[index1].characterId === cards[index2].characterId;
};
