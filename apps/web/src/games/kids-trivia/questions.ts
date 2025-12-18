export type KidsTriviaQuestion = {
  id: string;
  prompt: string;
  answer: string;
  options: string[];
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
  emoji: string;
  scripture: string;
};

export const kidsTriviaQuestions: KidsTriviaQuestion[] = [
  {
    id: 'noah-ark',
    prompt: 'Who built a huge ark so his family and animals could be safe from the flood?',
    answer: 'Noah',
    options: ['Noah', 'Moses', 'Abraham', 'David'],
    hint: 'Pairs of animals walked up the ramp.',
    difficulty: 'easy',
    emoji: '🌧️🐘🛶',
    scripture: 'Genesis 6:13-22',
  },
  {
    id: 'david-goliath',
    prompt: 'Who trusted Jehovah and defeated a giant with a sling and a stone?',
    answer: 'David',
    options: ['Samson', 'David', 'Gideon', 'Saul'],
    hint: 'He picked five smooth stones from a stream.',
    difficulty: 'easy',
    emoji: '🎯🪨🛡️',
    scripture: '1 Samuel 17:40-50',
  },
  {
    id: 'jonah-fish',
    prompt: 'Who prayed to Jehovah from inside a big fish?',
    answer: 'Jonah',
    options: ['Jonah', 'Daniel', 'Peter', 'Job'],
    hint: 'He tried to sail away instead of preaching.',
    difficulty: 'easy',
    emoji: '🐳🙏⛵️',
    scripture: 'Jonah 1:17–2:2',
  },
  {
    id: 'joseph-coat',
    prompt: 'Who received a special colorful coat from his father?',
    answer: 'Joseph',
    options: ['Joseph', 'Jacob', 'Mordecai', 'Joshua'],
    hint: 'His jealous brothers sold him.',
    difficulty: 'easy',
    emoji: '🧥🌈⭐️',
    scripture: 'Genesis 37:3-4',
  },
  {
    id: 'moses-sea',
    prompt: 'Who raised his staff and Jehovah parted a sea so the Israelites could cross?',
    answer: 'Moses',
    options: ['Elijah', 'Moses', 'Joshua', 'Aaron'],
    hint: 'The path was dry even though the sea was huge.',
    difficulty: 'medium',
    emoji: '🌊🪄🚶‍♂️',
    scripture: 'Exodus 14:21-22',
  },
  {
    id: 'daniel-lions',
    prompt: 'Who kept praying to Jehovah even when it meant being thrown into a lions’ den?',
    answer: 'Daniel',
    options: ['Daniel', 'Nehemiah', 'Elisha', 'Caleb'],
    hint: 'An angel shut the lions’ mouths.',
    difficulty: 'medium',
    emoji: '🦁🦁🙏',
    scripture: 'Daniel 6:10-22',
  },
  {
    id: 'esther-courage',
    prompt: 'Who bravely spoke to the king to save her people?',
    answer: 'Esther',
    options: ['Esther', 'Ruth', 'Hannah', 'Deborah'],
    hint: 'Her cousin Mordecai encouraged her.',
    difficulty: 'medium',
    emoji: '👑📜💎',
    scripture: 'Esther 4:13-17; 5:1-2',
  },
  {
    id: 'elijah-carmel',
    prompt: 'Who prayed and fire came down from heaven on Mount Carmel?',
    answer: 'Elijah',
    options: ['Elijah', 'Elisha', 'Samuel', 'Jeremiah'],
    hint: 'The altar was soaked with water first.',
    difficulty: 'medium',
    emoji: '🔥🪨⛰️',
    scripture: '1 Kings 18:36-38',
  },
  {
    id: 'jesus-storm',
    prompt: 'Who calmed a storm on the sea by saying, “Hush! Be quiet!”?',
    answer: 'Jesus',
    options: ['Peter', 'Jesus', 'Paul', 'John'],
    hint: 'The disciples were amazed that even the wind obeyed.',
    difficulty: 'hard',
    emoji: '🌊⛵️✋',
    scripture: 'Mark 4:37-41',
  },
  {
    id: 'paul-silas',
    prompt: 'Who sang Kingdom songs in jail until an earthquake opened the doors?',
    answer: 'Paul and Silas',
    options: ['Paul and Silas', 'Peter and John', 'Luke and Titus', 'James and Jude'],
    hint: 'The jailer asked them what to do to be saved.',
    difficulty: 'hard',
    emoji: '🎶⛓️⚡️',
    scripture: 'Acts 16:25-30',
  },
];

