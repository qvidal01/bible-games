// Bible Family Feud - Survey Questions
// Questions aligned with jw.org and NWT teachings
// "We surveyed 100 Bible students..."

import { SurveyQuestion } from '../types/game';

// Helper to create survey questions
function createQuestion(
  id: string,
  question: string,
  category: string,
  answers: { text: string; points: number }[]
): SurveyQuestion {
  const sortedAnswers = answers
    .sort((a, b) => b.points - a.points)
    .map((a, index) => ({
      id: `${id}-ans-${index}`,
      text: a.text,
      points: a.points,
      revealed: false,
      rank: index + 1,
    }));

  return {
    id,
    question,
    category,
    answers: sortedAnswers,
    totalPoints: sortedAnswers.reduce((sum, a) => sum + a.points, 0),
    isPlayed: false,
  };
}

// Survey Questions - Bible Family Feud Edition
export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // Bible Characters
  createQuestion('q1', 'Name a Bible character who showed great faith', 'Bible Characters', [
    { text: 'Abraham', points: 35 },
    { text: 'Moses', points: 25 },
    { text: 'David', points: 18 },
    { text: 'Noah', points: 12 },
    { text: 'Daniel', points: 7 },
    { text: 'Job', points: 3 },
  ]),

  createQuestion('q2', 'Name one of the 12 apostles of Jesus', 'Bible Characters', [
    { text: 'Peter', points: 30 },
    { text: 'John', points: 22 },
    { text: 'Matthew', points: 15 },
    { text: 'James', points: 12 },
    { text: 'Judas', points: 11 },
    { text: 'Thomas', points: 10 },
  ]),

  createQuestion('q3', 'Name a faithful woman mentioned in the Bible', 'Bible Characters', [
    { text: 'Ruth', points: 28 },
    { text: 'Esther', points: 22 },
    { text: 'Mary (Jesus\' mother)', points: 20 },
    { text: 'Sarah', points: 15 },
    { text: 'Hannah', points: 10 },
    { text: 'Deborah', points: 5 },
  ]),

  createQuestion('q4', 'Name a king mentioned in the Bible', 'Bible Characters', [
    { text: 'David', points: 35 },
    { text: 'Solomon', points: 28 },
    { text: 'Saul', points: 18 },
    { text: 'Nebuchadnezzar', points: 10 },
    { text: 'Pharaoh', points: 6 },
    { text: 'Herod', points: 3 },
  ]),

  // Bible Places
  createQuestion('q5', 'Name a city or place mentioned in the Bible', 'Bible Places', [
    { text: 'Jerusalem', points: 32 },
    { text: 'Bethlehem', points: 22 },
    { text: 'Egypt', points: 18 },
    { text: 'Babylon', points: 12 },
    { text: 'Nazareth', points: 10 },
    { text: 'Jericho', points: 6 },
  ]),

  createQuestion('q6', 'Name a body of water mentioned in the Bible', 'Bible Places', [
    { text: 'Red Sea', points: 30 },
    { text: 'Jordan River', points: 28 },
    { text: 'Sea of Galilee', points: 22 },
    { text: 'Mediterranean Sea', points: 12 },
    { text: 'Dead Sea', points: 8 },
  ]),

  createQuestion('q7', 'Name a mountain mentioned in the Bible', 'Bible Places', [
    { text: 'Mount Sinai', points: 35 },
    { text: 'Mount Ararat', points: 25 },
    { text: 'Mount of Olives', points: 20 },
    { text: 'Mount Carmel', points: 12 },
    { text: 'Mount Moriah', points: 8 },
  ]),

  // Bible Events
  createQuestion('q8', 'Name something that happened at Jesus\' birth', 'Bible Events', [
    { text: 'Angels appeared to shepherds', points: 28 },
    { text: 'Star appeared', points: 25 },
    { text: 'Wise men/astrologers visited', points: 20 },
    { text: 'Born in a manger/stable', points: 15 },
    { text: 'Shepherds visited', points: 12 },
  ]),

  createQuestion('q9', 'Name one of the ten plagues on Egypt', 'Bible Events', [
    { text: 'Death of firstborn', points: 25 },
    { text: 'Frogs', points: 18 },
    { text: 'Blood (water to blood)', points: 17 },
    { text: 'Darkness', points: 15 },
    { text: 'Locusts', points: 13 },
    { text: 'Boils', points: 12 },
  ]),

  createQuestion('q10', 'Name a miracle that Jesus performed', 'Bible Events', [
    { text: 'Raised Lazarus from dead', points: 25 },
    { text: 'Fed 5,000 people', points: 22 },
    { text: 'Walked on water', points: 20 },
    { text: 'Healed the blind', points: 15 },
    { text: 'Turned water to wine', points: 10 },
    { text: 'Calmed the storm', points: 8 },
  ]),

  createQuestion('q11', 'Name something found in the Garden of Eden', 'Bible Events', [
    { text: 'Tree of life', points: 30 },
    { text: 'Tree of knowledge', points: 28 },
    { text: 'Adam and Eve', points: 20 },
    { text: 'Serpent/Snake', points: 15 },
    { text: 'Animals', points: 7 },
  ]),

  // Fruits of the Spirit & Christian Qualities
  createQuestion('q12', 'Name a fruit of the spirit from Galatians 5:22-23', 'Christian Living', [
    { text: 'Love', points: 30 },
    { text: 'Joy', points: 18 },
    { text: 'Peace', points: 15 },
    { text: 'Patience', points: 12 },
    { text: 'Kindness', points: 10 },
    { text: 'Faith/Faithfulness', points: 8 },
    { text: 'Self-control', points: 7 },
  ]),

  createQuestion('q13', 'Name something Christians are encouraged to do daily', 'Christian Living', [
    { text: 'Pray', points: 35 },
    { text: 'Read the Bible', points: 30 },
    { text: 'Show love to others', points: 18 },
    { text: 'Meditate on scriptures', points: 10 },
    { text: 'Give thanks to Jehovah', points: 7 },
  ]),

  createQuestion('q14', 'Name something mentioned in the Lord\'s Prayer', 'Christian Living', [
    { text: 'Let your Kingdom come', points: 28 },
    { text: 'Hallowed be your name', points: 22 },
    { text: 'Give us our daily bread', points: 18 },
    { text: 'Forgive our sins/debts', points: 16 },
    { text: 'Deliver us from the wicked one', points: 10 },
    { text: 'Your will be done', points: 6 },
  ]),

  // Books of the Bible
  createQuestion('q15', 'Name one of the four Gospels', 'Books of Bible', [
    { text: 'Matthew', points: 30 },
    { text: 'Mark', points: 25 },
    { text: 'Luke', points: 23 },
    { text: 'John', points: 22 },
  ]),

  createQuestion('q16', 'Name a book in the Hebrew Scriptures (Old Testament)', 'Books of Bible', [
    { text: 'Genesis', points: 30 },
    { text: 'Psalms', points: 22 },
    { text: 'Proverbs', points: 18 },
    { text: 'Isaiah', points: 12 },
    { text: 'Exodus', points: 10 },
    { text: 'Daniel', points: 8 },
  ]),

  createQuestion('q17', 'Name a letter written by the apostle Paul', 'Books of Bible', [
    { text: 'Romans', points: 25 },
    { text: 'Corinthians', points: 22 },
    { text: 'Galatians', points: 18 },
    { text: 'Ephesians', points: 15 },
    { text: 'Philippians', points: 12 },
    { text: 'Timothy', points: 8 },
  ]),

  // Prophets
  createQuestion('q18', 'Name a prophet in the Bible', 'Prophets', [
    { text: 'Elijah', points: 28 },
    { text: 'Isaiah', points: 22 },
    { text: 'Jeremiah', points: 18 },
    { text: 'Daniel', points: 15 },
    { text: 'Moses', points: 10 },
    { text: 'Ezekiel', points: 7 },
  ]),

  createQuestion('q19', 'Name something a prophet in the Bible foretold', 'Prophets', [
    { text: 'Messiah\'s coming', points: 32 },
    { text: 'Destruction of Jerusalem', points: 22 },
    { text: 'God\'s Kingdom', points: 20 },
    { text: 'End of the world', points: 15 },
    { text: 'Resurrection', points: 11 },
  ]),

  // Jesus Christ
  createQuestion('q20', 'Name a title or name used for Jesus', 'Jesus Christ', [
    { text: 'Christ/Messiah', points: 28 },
    { text: 'Son of God', points: 24 },
    { text: 'Son of Man', points: 18 },
    { text: 'King', points: 15 },
    { text: 'Lamb of God', points: 10 },
    { text: 'Prince of Peace', points: 5 },
  ]),

  createQuestion('q21', 'Name a parable that Jesus taught', 'Jesus Christ', [
    { text: 'Prodigal Son', points: 28 },
    { text: 'Good Samaritan', points: 25 },
    { text: 'Sower/Seeds', points: 18 },
    { text: 'Ten Virgins', points: 12 },
    { text: 'Talents/Minas', points: 10 },
    { text: 'Lost Sheep', points: 7 },
  ]),

  createQuestion('q22', 'Name something that happened during Jesus\' ministry', 'Jesus Christ', [
    { text: 'Healed the sick', points: 28 },
    { text: 'Preached/Taught', points: 22 },
    { text: 'Chose the apostles', points: 18 },
    { text: 'Fed crowds', points: 15 },
    { text: 'Raised the dead', points: 12 },
    { text: 'Was baptized', points: 5 },
  ]),

  // God's Kingdom
  createQuestion('q23', 'Name a blessing promised in the new world/paradise', 'God\'s Kingdom', [
    { text: 'No more death', points: 30 },
    { text: 'No more sickness', points: 25 },
    { text: 'Peace', points: 18 },
    { text: 'Resurrection', points: 15 },
    { text: 'No more pain/suffering', points: 12 },
  ]),

  createQuestion('q24', 'Name something the Bible says about Jehovah', 'God\'s Kingdom', [
    { text: 'He is love', points: 30 },
    { text: 'He is almighty/all-powerful', points: 22 },
    { text: 'He is the Creator', points: 20 },
    { text: 'He hears prayers', points: 15 },
    { text: 'He is just/righteous', points: 13 },
  ]),

  // Marriage & Family
  createQuestion('q25', 'Name a Bible principle for a happy marriage', 'Marriage & Family', [
    { text: 'Love each other', points: 30 },
    { text: 'Respect/Honor spouse', points: 25 },
    { text: 'Be faithful', points: 20 },
    { text: 'Communicate', points: 13 },
    { text: 'Forgive', points: 12 },
  ]),

  createQuestion('q26', 'Name a married couple in the Bible', 'Marriage & Family', [
    { text: 'Adam and Eve', points: 32 },
    { text: 'Abraham and Sarah', points: 28 },
    { text: 'Isaac and Rebekah', points: 18 },
    { text: 'Joseph and Mary', points: 12 },
    { text: 'Aquila and Priscilla', points: 10 },
  ]),

  // Animals in the Bible
  createQuestion('q27', 'Name an animal mentioned in the Bible', 'Bible Animals', [
    { text: 'Lion', points: 25 },
    { text: 'Lamb/Sheep', points: 23 },
    { text: 'Serpent/Snake', points: 20 },
    { text: 'Dove', points: 15 },
    { text: 'Fish', points: 10 },
    { text: 'Donkey', points: 7 },
  ]),

  createQuestion('q28', 'Name an animal that was on Noah\'s ark', 'Bible Animals', [
    { text: 'Lion', points: 22 },
    { text: 'Elephant', points: 20 },
    { text: 'Giraffe', points: 18 },
    { text: 'Dove', points: 15 },
    { text: 'Raven', points: 13 },
    { text: 'Snake/Serpent', points: 12 },
  ]),

  // Numbers
  createQuestion('q29', 'Name a significant number in the Bible', 'Bible Numbers', [
    { text: '7 (completion/perfection)', points: 28 },
    { text: '12 (apostles/tribes)', points: 25 },
    { text: '40 (testing period)', points: 20 },
    { text: '3 (emphasis)', points: 15 },
    { text: '144,000 (heavenly rulers)', points: 12 },
  ]),

  // Worship
  createQuestion('q31', 'Name something used in worship in Bible times', 'Worship', [
    { text: 'Sacrifices', points: 28 },
    { text: 'Prayer', points: 25 },
    { text: 'Music/Singing', points: 20 },
    { text: 'Incense', points: 15 },
    { text: 'Reading Scripture', points: 12 },
  ]),

  createQuestion('q32', 'Name a Jewish festival or observance', 'Worship', [
    { text: 'Passover', points: 35 },
    { text: 'Sabbath', points: 25 },
    { text: 'Pentecost/Festival of Weeks', points: 18 },
    { text: 'Festival of Booths/Tabernacles', points: 12 },
    { text: 'Day of Atonement', points: 10 },
  ]),

  // Food in the Bible
  createQuestion('q33', 'Name a food mentioned in the Bible', 'Bible Foods', [
    { text: 'Bread', points: 30 },
    { text: 'Fish', points: 22 },
    { text: 'Wine', points: 18 },
    { text: 'Honey', points: 15 },
    { text: 'Fruit (figs, grapes)', points: 10 },
    { text: 'Manna', points: 5 },
  ]),

  // Creation
  createQuestion('q34', 'Name something God created according to Genesis', 'Creation', [
    { text: 'Humans/Man', points: 28 },
    { text: 'Animals', points: 22 },
    { text: 'Light', points: 18 },
    { text: 'Earth/Land', points: 15 },
    { text: 'Plants/Trees', points: 10 },
    { text: 'Sun/Moon/Stars', points: 7 },
  ]),

  createQuestion('q35', 'Name something created on day one through six of creation', 'Creation', [
    { text: 'Light', points: 25 },
    { text: 'Sky/Heavens', points: 20 },
    { text: 'Land and seas', points: 18 },
    { text: 'Sun, moon, stars', points: 15 },
    { text: 'Fish and birds', points: 12 },
    { text: 'Land animals and humans', points: 10 },
  ]),
];

// Get random questions for a game
export function getRandomQuestions(count: number): SurveyQuestion[] {
  const shuffled = [...SURVEY_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(q => ({
    ...q,
    answers: q.answers.map(a => ({ ...a, revealed: false })),
    isPlayed: false,
  }));
}

// Get questions by category
export function getQuestionsByCategory(category: string): SurveyQuestion[] {
  return SURVEY_QUESTIONS.filter(q => q.category === category);
}

// Get all unique categories
export function getCategories(): string[] {
  return [...new Set(SURVEY_QUESTIONS.map(q => q.category))];
}
