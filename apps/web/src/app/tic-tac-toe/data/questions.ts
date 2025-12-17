// Bible Tic Tac Toe - Questions
// Simplified trivia questions adapted from Jeopardy format

import { TriviaQuestion } from '../types/game';

// Easy questions - straightforward Bible facts
export const EASY_QUESTIONS: Omit<TriviaQuestion, 'id'>[] = [
  // Bible Characters
  { question: 'Who built an ark to save his family and animals from the Flood?', answer: 'Noah', category: 'Bible Characters', difficulty: 'easy' },
  { question: 'Who was the first woman created by God?', answer: 'Eve', category: 'Bible Characters', difficulty: 'easy' },
  { question: 'This man built an ark. What was his name?', answer: 'Noah', category: 'Bible Characters', difficulty: 'easy' },
  { question: 'Who was the strongest man in the Bible?', answer: 'Samson', category: 'Bible Characters', difficulty: 'easy' },
  { question: 'Who was swallowed by a great fish?', answer: 'Jonah', category: 'Bible Characters', difficulty: 'easy' },
  { question: 'Who killed Goliath with a sling and stone?', answer: 'David', category: 'Bible Characters', difficulty: 'easy' },

  // Books of the Bible
  { question: 'What is the first book of the Bible?', answer: 'Genesis', category: 'Books of the Bible', difficulty: 'easy' },
  { question: 'Which book contains 150 songs and poems, many written by David?', answer: 'Psalms', category: 'Books of the Bible', difficulty: 'easy' },
  { question: 'What is the last book of the Bible?', answer: 'Revelation', category: 'Books of the Bible', difficulty: 'easy' },

  // Numbers
  { question: 'How many days and nights did it rain during the Flood?', answer: '40', category: 'Numbers', difficulty: 'easy' },
  { question: 'How many apostles did Jesus choose?', answer: '12', category: 'Numbers', difficulty: 'easy' },
  { question: 'How many books are in the Bible?', answer: '66', category: 'Numbers', difficulty: 'easy' },

  // Places
  { question: 'Where did Adam and Eve first live?', answer: 'Garden of Eden', category: 'Places', difficulty: 'easy' },
  { question: 'In what town was Jesus born?', answer: 'Bethlehem', category: 'Places', difficulty: 'easy' },
  { question: 'Where did Jesus grow up?', answer: 'Nazareth', category: 'Places', difficulty: 'easy' },

  // Jesus Christ
  { question: 'What did Jesus turn water into at a wedding?', answer: 'Wine', category: 'Jesus Christ', difficulty: 'easy' },
  { question: "What was Jesus' earthly occupation before his ministry?", answer: 'Carpenter', category: 'Jesus Christ', difficulty: 'easy' },
  { question: 'In what river was Jesus baptized?', answer: 'Jordan River', category: 'Jesus Christ', difficulty: 'easy' },
];

// Medium questions - require more Bible knowledge
export const MEDIUM_QUESTIONS: Omit<TriviaQuestion, 'id'>[] = [
  // Bible Characters
  { question: 'Who was sold into slavery by his brothers but became second in command of Egypt?', answer: 'Joseph', category: 'Bible Characters', difficulty: 'medium' },
  { question: 'Which prophet was taken up to heaven in a fiery chariot?', answer: 'Elijah', category: 'Bible Characters', difficulty: 'medium' },
  { question: 'Who challenged 450 prophets of Baal on Mount Carmel?', answer: 'Elijah', category: 'Prophets', difficulty: 'medium' },
  { question: 'Who denied Jesus three times before the rooster crowed?', answer: 'Peter', category: 'Bible Characters', difficulty: 'medium' },
  { question: 'Which queen risked her life to save her people from Haman?', answer: 'Esther', category: 'Women of the Bible', difficulty: 'medium' },
  { question: 'Who was thrown into a lions\' den but survived?', answer: 'Daniel', category: 'Prophets', difficulty: 'medium' },

  // Old Testament Events
  { question: 'What body of water parted so the Israelites could escape Egypt?', answer: 'Red Sea', category: 'Old Testament', difficulty: 'medium' },
  { question: 'On what mountain did God give Moses the Ten Commandments?', answer: 'Mount Sinai', category: 'Old Testament', difficulty: 'medium' },
  { question: 'The walls of which city fell after the Israelites marched around it for seven days?', answer: 'Jericho', category: 'Old Testament', difficulty: 'medium' },

  // New Testament
  { question: 'Who did Jesus raise from the dead after four days in the tomb?', answer: 'Lazarus', category: 'New Testament', difficulty: 'medium' },
  { question: 'On what island did John receive the Revelation?', answer: 'Patmos', category: 'New Testament', difficulty: 'medium' },
  { question: 'Paul was on his way to which city when he saw a blinding light?', answer: 'Damascus', category: 'New Testament', difficulty: 'medium' },

  // Parables
  { question: 'In this parable, a father welcomes back his wayward son. What is it called?', answer: 'Prodigal Son', category: 'Parables', difficulty: 'medium' },
  { question: 'In this parable, a traveler is helped by someone from a despised nation. What is it called?', answer: 'Good Samaritan', category: 'Parables', difficulty: 'medium' },

  // Miracles
  { question: 'How many loaves and fish did Jesus use to feed 5,000 men?', answer: '5 loaves and 2 fish', category: 'Miracles', difficulty: 'medium' },
  { question: 'On what body of water did Jesus walk?', answer: 'Sea of Galilee', category: 'Miracles', difficulty: 'medium' },

  // Kings & Rulers
  { question: 'Which king was known for his great wisdom and built the first temple?', answer: 'Solomon', category: 'Kings', difficulty: 'medium' },
  { question: 'Who was the first king of Israel, anointed by Samuel?', answer: 'Saul', category: 'Kings', difficulty: 'medium' },
];

// Hard questions - advanced Bible knowledge
export const HARD_QUESTIONS: Omit<TriviaQuestion, 'id'>[] = [
  // Deep Knowledge
  { question: 'Which prophet foretold that the Messiah would be born in Bethlehem?', answer: 'Micah', category: 'Prophets', difficulty: 'hard' },
  { question: 'Which prophet saw the vision of the valley of dry bones coming to life?', answer: 'Ezekiel', category: 'Prophets', difficulty: 'hard' },
  { question: 'Which prophet was told to marry an unfaithful woman as an illustration?', answer: 'Hosea', category: 'Prophets', difficulty: 'hard' },
  { question: 'What is the last book of the Old Testament (Hebrew Scriptures)?', answer: 'Malachi', category: 'Books of the Bible', difficulty: 'hard' },
  { question: 'Which woman hid Israelite spies in Jericho and was saved with her family?', answer: 'Rahab', category: 'Women of the Bible', difficulty: 'hard' },
  { question: "Who was Timothy's grandmother who taught him the Scriptures?", answer: 'Lois', category: 'Women of the Bible', difficulty: 'hard' },
  { question: 'Which Babylonian king had a dream about a large image with feet of clay?', answer: 'Nebuchadnezzar', category: 'Kings', difficulty: 'hard' },
  { question: 'Which faithful king of Judah held a great Passover and found the book of the Law?', answer: 'Josiah', category: 'Kings', difficulty: 'hard' },
  { question: 'Abraham was called to leave which city in Mesopotamia?', answer: 'Ur', category: 'Places', difficulty: 'hard' },
  { question: 'On which mountain was Abraham told to sacrifice Isaac?', answer: 'Mount Moriah', category: 'Places', difficulty: 'hard' },
  { question: 'Paul established a congregation in this Greek city known for its immorality.', answer: 'Corinth', category: 'Places', difficulty: 'hard' },
  { question: "Whose bones brought a dead man back to life when the body touched them?", answer: 'Elisha', category: 'Miracles', difficulty: 'hard' },
  { question: 'In the parable, how many virgins were wise and had oil-filled lamps?', answer: '5', category: 'Parables', difficulty: 'hard' },
  { question: 'How many years did the Israelites wander in the wilderness?', answer: '40', category: 'Numbers', difficulty: 'hard' },
  { question: 'How old was Moses when he died?', answer: '120', category: 'Numbers', difficulty: 'hard' },
];

// All questions combined with IDs
let questionId = 0;
const addIds = (questions: Omit<TriviaQuestion, 'id'>[]): TriviaQuestion[] =>
  questions.map((q) => ({ ...q, id: `q-${++questionId}` }));

export const ALL_QUESTIONS: TriviaQuestion[] = [
  ...addIds(EASY_QUESTIONS),
  ...addIds(MEDIUM_QUESTIONS),
  ...addIds(HARD_QUESTIONS),
];

// Get questions by difficulty
export const getQuestionsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard' | 'mixed'): TriviaQuestion[] => {
  if (difficulty === 'mixed') {
    return ALL_QUESTIONS;
  }
  return ALL_QUESTIONS.filter((q) => q.difficulty === difficulty);
};

// Get a random question
export const getRandomQuestion = (
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed',
  usedIds: Set<string> = new Set()
): TriviaQuestion | null => {
  const available = getQuestionsByDifficulty(difficulty).filter((q) => !usedIds.has(q.id));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
};

// Shuffle array helper
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
