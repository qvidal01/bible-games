// Bible Jeopardy Categories - JW Edition
// Questions aligned with jw.org and NWT teachings

import { CategoryDefinition, Question } from '../types/game';

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { id: 'finish-verse', name: 'Finish the Verse', description: 'Complete the Bible verse' },
  { id: 'finish-phrase', name: 'Finish the Phrase', description: 'Complete the famous Bible phrase' },
  { id: 'name-that-song', name: 'Name That Song', description: 'Identify the Kingdom song' },
  { id: 'bible-characters', name: 'Bible Characters', description: 'Who did what, who said what' },
  { id: 'books-of-bible', name: 'Books of the Bible', description: 'Facts about specific books' },
  { id: 'old-testament', name: 'Old Testament', description: 'Events and accounts from Hebrew Scriptures' },
  { id: 'new-testament', name: 'New Testament', description: 'Events from Gospels, Acts, and letters' },
  { id: 'gods-kingdom', name: "God's Kingdom", description: 'Teachings about the Kingdom' },
  { id: 'jesus-christ', name: 'Jesus Christ', description: 'His life, teachings, and miracles' },
  { id: 'prophets', name: 'Prophets & Prophecies', description: 'Who prophesied what' },
  { id: 'kings-rulers', name: 'Kings & Rulers', description: 'Bible kings and their reigns' },
  { id: 'women-of-bible', name: 'Women of the Bible', description: 'Faithful women and their stories' },
  { id: 'parables', name: 'Parables', description: "Jesus' illustrations" },
  { id: 'miracles', name: 'Miracles', description: 'Miraculous events in the Bible' },
  { id: 'bible-places', name: 'Bible Places', description: 'Locations and their significance' },
  { id: 'numbers-in-bible', name: 'Numbers in the Bible', description: 'Significant numbers' },
  { id: 'who-said-it', name: 'Who Said It?', description: 'Match the quote to the person' },
  { id: 'before-after', name: 'Before & After', description: 'What came before or after an event' },
  { id: 'faith-worship', name: 'Faith & Worship', description: 'Prayer, study, and godly qualities' },
  { id: 'marriage-family', name: 'Marriage & Family', description: 'Bible principles for families' },
];

// Question bank organized by category
// Each category has questions at different point values: 200, 400, 600, 800, 1000

export const QUESTIONS_BY_CATEGORY: Record<string, Omit<Question, 'id' | 'isAnswered'>[]> = {
  'finish-verse': [
    { category: 'finish-verse', value: 200, question: '"For God loved the world so much that he gave..."', answer: 'What is "his only-begotten Son, so that everyone exercising faith in him might not be destroyed but have everlasting life"? (John 3:16)' },
    { category: 'finish-verse', value: 400, question: '"Trust in Jehovah with all your heart..."', answer: 'What is "and do not rely on your own understanding"? (Proverbs 3:5)' },
    { category: 'finish-verse', value: 600, question: '"The fear of Jehovah is..."', answer: 'What is "the beginning of wisdom"? (Proverbs 9:10)' },
    { category: 'finish-verse', value: 800, question: '"Draw close to God..."', answer: 'What is "and he will draw close to you"? (James 4:8)' },
    { category: 'finish-verse', value: 1000, question: '"Taste and see that Jehovah is good..."', answer: 'What is "happy is the man who takes refuge in him"? (Psalm 34:8)' },
  ],
  'finish-phrase': [
    { category: 'finish-phrase', value: 200, question: '"An eye for an eye..."', answer: 'What is "a tooth for a tooth"?' },
    { category: 'finish-phrase', value: 400, question: '"The love of money..."', answer: 'What is "is a root of all sorts of injurious things"?' },
    { category: 'finish-phrase', value: 600, question: '"Bad associations..."', answer: 'What is "spoil useful habits"? (1 Corinthians 15:33)' },
    { category: 'finish-phrase', value: 800, question: '"A threefold cord..."', answer: 'What is "cannot quickly be torn apart"? (Ecclesiastes 4:12)' },
    { category: 'finish-phrase', value: 1000, question: '"There is more happiness in giving..."', answer: 'What is "than there is in receiving"? (Acts 20:35)' },
  ],
  'name-that-song': [
    { category: 'name-that-song', value: 200, question: 'This Kingdom song includes the lyrics: "Life without end at last!"', answer: 'What is "Life Without End—At Last!"?' },
    { category: 'name-that-song', value: 400, question: 'This song talks about preaching from door to door and sharing the good news.', answer: 'What is "Preach the Word"?' },
    { category: 'name-that-song', value: 600, question: 'This song encourages us to be courageous and trust in Jehovah during difficult times.', answer: 'What is "Be Courageous"?' },
    { category: 'name-that-song', value: 800, question: 'This song is about the beauty of the new world and Jehovah\'s promises.', answer: 'What is "Paradise to Come"?' },
    { category: 'name-that-song', value: 1000, question: 'This song is typically sung at the end of conventions and assemblies.', answer: 'What is "Forward, You Witnesses!"?' },
  ],
  'bible-characters': [
    { category: 'bible-characters', value: 200, question: 'This man built an ark to save his family and animals from the Flood.', answer: 'Who is Noah?' },
    { category: 'bible-characters', value: 400, question: 'This strong man lost his strength when Delilah had his hair cut.', answer: 'Who is Samson?' },
    { category: 'bible-characters', value: 600, question: 'This prophet was taken up to heaven in a fiery chariot.', answer: 'Who is Elijah?' },
    { category: 'bible-characters', value: 800, question: 'This man was sold by his brothers into slavery but became second in command of Egypt.', answer: 'Who is Joseph?' },
    { category: 'bible-characters', value: 1000, question: 'This woman was a judge and prophetess who helped Barak defeat Sisera.', answer: 'Who is Deborah?' },
  ],
  'books-of-bible': [
    { category: 'books-of-bible', value: 200, question: 'This is the first book of the Bible.', answer: 'What is Genesis?' },
    { category: 'books-of-bible', value: 400, question: 'This book contains 150 songs and poems, many written by David.', answer: 'What is Psalms?' },
    { category: 'books-of-bible', value: 600, question: 'This book was written by Luke and describes the early Christian congregation.', answer: 'What is Acts (of the Apostles)?' },
    { category: 'books-of-bible', value: 800, question: 'This is the last book of the Hebrew Scriptures (Old Testament).', answer: 'What is Malachi?' },
    { category: 'books-of-bible', value: 1000, question: 'This book, written by a tax collector, contains the Sermon on the Mount.', answer: 'What is Matthew?' },
  ],
  'old-testament': [
    { category: 'old-testament', value: 200, question: 'This body of water parted so the Israelites could escape Egypt.', answer: 'What is the Red Sea?' },
    { category: 'old-testament', value: 400, question: 'God gave Moses the Ten Commandments on this mountain.', answer: 'What is Mount Sinai (or Horeb)?' },
    { category: 'old-testament', value: 600, question: 'This Philistine giant was killed by young David with a sling and stone.', answer: 'Who is Goliath?' },
    { category: 'old-testament', value: 800, question: 'The walls of this city fell after the Israelites marched around it for seven days.', answer: 'What is Jericho?' },
    { category: 'old-testament', value: 1000, question: 'This prophet spent three days and nights in the belly of a great fish.', answer: 'Who is Jonah?' },
  ],
  'new-testament': [
    { category: 'new-testament', value: 200, question: 'Jesus was baptized in this river by John the Baptist.', answer: 'What is the Jordan River?' },
    { category: 'new-testament', value: 400, question: 'Jesus raised this man from the dead after he had been in the tomb for four days.', answer: 'Who is Lazarus?' },
    { category: 'new-testament', value: 600, question: 'This apostle denied Jesus three times before the rooster crowed.', answer: 'Who is Peter?' },
    { category: 'new-testament', value: 800, question: 'Paul was on his way to this city when he saw a blinding light and heard Jesus\' voice.', answer: 'What is Damascus?' },
    { category: 'new-testament', value: 1000, question: 'This was the name of the island where John received the Revelation.', answer: 'What is Patmos?' },
  ],
  'gods-kingdom': [
    { category: 'gods-kingdom', value: 200, question: 'Jesus taught us to pray for this to come in the Lord\'s Prayer.', answer: 'What is God\'s Kingdom?' },
    { category: 'gods-kingdom', value: 400, question: 'According to Daniel 2:44, God\'s Kingdom will do this to all human governments.', answer: 'What is crush and put an end to them?' },
    { category: 'gods-kingdom', value: 600, question: 'This number represents those who will rule with Christ in heaven.', answer: 'What is 144,000?' },
    { category: 'gods-kingdom', value: 800, question: 'According to Bible prophecy, God\'s Kingdom was established in heaven in this year.', answer: 'What is 1914?' },
    { category: 'gods-kingdom', value: 1000, question: 'Jesus said his Kingdom is no part of this.', answer: 'What is the world?' },
  ],
  'jesus-christ': [
    { category: 'jesus-christ', value: 200, question: 'Jesus was born in this town.', answer: 'What is Bethlehem?' },
    { category: 'jesus-christ', value: 400, question: 'Jesus performed his first miracle at a wedding by turning water into this.', answer: 'What is wine?' },
    { category: 'jesus-christ', value: 600, question: 'This was Jesus\' earthly occupation before his ministry.', answer: 'What is a carpenter?' },
    { category: 'jesus-christ', value: 800, question: 'Jesus died on this, not a cross according to the Bible.', answer: 'What is a stake (or torture stake)?' },
    { category: 'jesus-christ', value: 1000, question: 'This is Jesus\' prehuman name as God\'s firstborn Son.', answer: 'Who is Michael (the archangel)?' },
  ],
  'prophets': [
    { category: 'prophets', value: 200, question: 'This prophet was thrown into a lions\' den but survived.', answer: 'Who is Daniel?' },
    { category: 'prophets', value: 400, question: 'This prophet challenged the 450 prophets of Baal on Mount Carmel.', answer: 'Who is Elijah?' },
    { category: 'prophets', value: 600, question: 'This prophet foretold that the Messiah would be born in Bethlehem.', answer: 'Who is Micah? (Micah 5:2)' },
    { category: 'prophets', value: 800, question: 'This prophet was told to marry an unfaithful woman as an illustration.', answer: 'Who is Hosea?' },
    { category: 'prophets', value: 1000, question: 'This prophet saw the vision of the valley of dry bones coming to life.', answer: 'Who is Ezekiel?' },
  ],
  'kings-rulers': [
    { category: 'kings-rulers', value: 200, question: 'This king was known for his great wisdom and built the first temple.', answer: 'Who is Solomon?' },
    { category: 'kings-rulers', value: 400, question: 'This was the first king of Israel, anointed by Samuel.', answer: 'Who is Saul?' },
    { category: 'kings-rulers', value: 600, question: 'This Babylonian king had a dream about a large image with feet of clay.', answer: 'Who is Nebuchadnezzar?' },
    { category: 'kings-rulers', value: 800, question: 'This king tried to kill baby Moses and later let Israel go after ten plagues.', answer: 'Who is Pharaoh?' },
    { category: 'kings-rulers', value: 1000, question: 'This faithful king of Judah held a great Passover and found the book of the Law.', answer: 'Who is Josiah?' },
  ],
  'women-of-bible': [
    { category: 'women-of-bible', value: 200, question: 'This was the first woman created by God.', answer: 'Who is Eve?' },
    { category: 'women-of-bible', value: 400, question: 'This faithful woman said "Your people will be my people, and your God my God."', answer: 'Who is Ruth?' },
    { category: 'women-of-bible', value: 600, question: 'This queen risked her life to save her people from Haman\'s plot.', answer: 'Who is Esther?' },
    { category: 'women-of-bible', value: 800, question: 'This woman hid Israelite spies in Jericho and was saved with her family.', answer: 'Who is Rahab?' },
    { category: 'women-of-bible', value: 1000, question: 'This was Timothy\'s grandmother who taught him the Scriptures.', answer: 'Who is Lois?' },
  ],
  'parables': [
    { category: 'parables', value: 200, question: 'In this parable, a father welcomes back his wayward son with open arms.', answer: 'What is the Parable of the Prodigal Son?' },
    { category: 'parables', value: 400, question: 'In this parable, a traveler is helped by someone from a despised nation.', answer: 'What is the Parable of the Good Samaritan?' },
    { category: 'parables', value: 600, question: 'In this parable, seeds fall on different types of soil representing hearts.', answer: 'What is the Parable of the Sower?' },
    { category: 'parables', value: 800, question: 'In this parable, workers hired at different hours all receive the same wage.', answer: 'What is the Parable of the Workers in the Vineyard?' },
    { category: 'parables', value: 1000, question: 'In this parable, virgins with oil-filled lamps are prepared while others are not.', answer: 'What is the Parable of the Ten Virgins?' },
  ],
  'miracles': [
    { category: 'miracles', value: 200, question: 'Jesus fed 5,000 men with this many loaves and fish.', answer: 'What is 5 loaves and 2 fish?' },
    { category: 'miracles', value: 400, question: 'Jesus walked on water on this body of water.', answer: 'What is the Sea of Galilee?' },
    { category: 'miracles', value: 600, question: 'Elijah multiplied oil and flour for this widow during a famine.', answer: 'Who is the widow of Zarephath?' },
    { category: 'miracles', value: 800, question: 'Jesus healed this many lepers, but only one returned to thank him.', answer: 'What is ten?' },
    { category: 'miracles', value: 1000, question: 'This man\'s bones brought a dead man back to life when the body touched them.', answer: 'Who is Elisha?' },
  ],
  'bible-places': [
    { category: 'bible-places', value: 200, question: 'This garden was where Adam and Eve first lived.', answer: 'What is the Garden of Eden?' },
    { category: 'bible-places', value: 400, question: 'Jesus grew up in this town in Galilee.', answer: 'What is Nazareth?' },
    { category: 'bible-places', value: 600, question: 'Abraham was called to leave this city in Mesopotamia.', answer: 'What is Ur (of the Chaldeans)?' },
    { category: 'bible-places', value: 800, question: 'Paul established a congregation in this Greek city known for its immorality.', answer: 'What is Corinth?' },
    { category: 'bible-places', value: 1000, question: 'This mountain is where Abraham was told to sacrifice Isaac.', answer: 'What is Mount Moriah?' },
  ],
  'numbers-in-bible': [
    { category: 'numbers-in-bible', value: 200, question: 'This is the number of days and nights it rained during the Flood.', answer: 'What is 40?' },
    { category: 'numbers-in-bible', value: 400, question: 'This is the number of apostles Jesus chose.', answer: 'What is 12?' },
    { category: 'numbers-in-bible', value: 600, question: 'This is how old Moses was when he died.', answer: 'What is 120 years old?' },
    { category: 'numbers-in-bible', value: 800, question: 'This is the number of years the Israelites wandered in the wilderness.', answer: 'What is 40 years?' },
    { category: 'numbers-in-bible', value: 1000, question: 'This is the number of books in the Bible.', answer: 'What is 66?' },
  ],
  'who-said-it': [
    { category: 'who-said-it', value: 200, question: '"Let there be light."', answer: 'Who is God (Jehovah)?' },
    { category: 'who-said-it', value: 400, question: '"Am I my brother\'s keeper?"', answer: 'Who is Cain?' },
    { category: 'who-said-it', value: 600, question: '"Here I am! Send me!"', answer: 'Who is Isaiah?' },
    { category: 'who-said-it', value: 800, question: '"Look! The Lamb of God who takes away the sin of the world!"', answer: 'Who is John the Baptist?' },
    { category: 'who-said-it', value: 1000, question: '"I have fought the fine fight, I have run the race to the finish."', answer: 'Who is the apostle Paul?' },
  ],
  'before-after': [
    { category: 'before-after', value: 200, question: 'This event happened right before Jesus started his ministry.', answer: 'What is his baptism?' },
    { category: 'before-after', value: 400, question: 'This plague came right before the death of the firstborn in Egypt.', answer: 'What is the plague of darkness (three days)?' },
    { category: 'before-after', value: 600, question: 'This happened immediately after Jesus died.', answer: 'What is the curtain of the sanctuary was torn in two?' },
    { category: 'before-after', value: 800, question: 'This king ruled Israel right before it was divided into two kingdoms.', answer: 'Who is Solomon?' },
    { category: 'before-after', value: 1000, question: 'This event comes right after the 1,000-year reign of Christ.', answer: 'What is the final test (Satan released for a short time)?' },
  ],
  'faith-worship': [
    { category: 'faith-worship', value: 200, question: 'Hebrews 11:1 says faith is the "assured expectation" of this.', answer: 'What are things hoped for?' },
    { category: 'faith-worship', value: 400, question: 'According to James 2:26, faith without this is dead.', answer: 'What are works?' },
    { category: 'faith-worship', value: 600, question: 'This is the name God uses for himself, meaning "He Causes to Become."', answer: 'What is Jehovah?' },
    { category: 'faith-worship', value: 800, question: 'According to John 4:24, God must be worshipped in spirit and this.', answer: 'What is truth?' },
    { category: 'faith-worship', value: 1000, question: 'These are the two greatest commandments according to Jesus.', answer: 'What is love Jehovah your God with your whole heart, soul, mind, and strength AND love your neighbor as yourself?' },
  ],
  'marriage-family': [
    { category: 'marriage-family', value: 200, question: 'According to Genesis, a man leaves his father and mother and sticks to his wife, becoming this.', answer: 'What is one flesh?' },
    { category: 'marriage-family', value: 400, question: 'Ephesians 5:23 says the husband is the head of the wife, just as Christ is head of this.', answer: 'What is the congregation?' },
    { category: 'marriage-family', value: 600, question: 'According to Ephesians 6:4, fathers should bring children up in this.', answer: 'What is the discipline and admonition of Jehovah?' },
    { category: 'marriage-family', value: 800, question: 'Proverbs 31 describes this type of capable wife.', answer: 'What is a wife whose value is far more than corals (or rubies)?' },
    { category: 'marriage-family', value: 1000, question: 'According to 1 Corinthians 7:39, a widow is free to marry, but only in this way.', answer: 'What is only in the Lord (to a fellow believer)?' },
  ],
};

// Helper function to get questions for a category
export function getQuestionsForCategory(categoryId: string): Question[] {
  const questions = QUESTIONS_BY_CATEGORY[categoryId] || [];
  return questions.map((q, index) => ({
    ...q,
    id: `${categoryId}-${index}`,
    isAnswered: false,
  }));
}

// Helper to get random categories
export function getRandomCategories(count: number): CategoryDefinition[] {
  const shuffled = [...CATEGORY_DEFINITIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Final Jeopardy Questions
export interface FinalJeopardyQuestion {
  category: string;
  question: string;
  answer: string;
}

export const FINAL_JEOPARDY_QUESTIONS: FinalJeopardyQuestion[] = [
  {
    category: "Bible Firsts",
    question: "This man was the first to be called a Hebrew in the Bible.",
    answer: "Who is Abraham? (Genesis 14:13)"
  },
  {
    category: "Prophecy Fulfilled",
    question: "Isaiah 53 prophesied that the Messiah would be buried with the wicked but also with this type of person in his death.",
    answer: "What is a rich man? (Isaiah 53:9, Matthew 27:57-60)"
  },
  {
    category: "God's Promises",
    question: "According to Revelation 21:4, these four things will be no more in the new world.",
    answer: "What are death, mourning, outcry, and pain?"
  },
  {
    category: "Bible Numbers",
    question: "This is the total number of years from Adam's creation to the Flood, according to Bible chronology.",
    answer: "What is 1,656 years?"
  },
  {
    category: "Faithful Women",
    question: "This woman is mentioned in Matthew's genealogy of Jesus and was the mother of Boaz.",
    answer: "Who is Rahab? (Matthew 1:5)"
  },
  {
    category: "Jesus' Ministry",
    question: "Jesus' ministry lasted approximately this many years, from his baptism to his death.",
    answer: "What is three and a half years?"
  },
  {
    category: "Kingdom Hope",
    question: "Daniel 2:44 says God's Kingdom will do this to all the kingdoms represented in Nebuchadnezzar's dream.",
    answer: "What is crush and put an end to all these kingdoms, and it alone will stand forever?"
  },
  {
    category: "Bible Geography",
    question: "This was the final city where Paul was imprisoned before his death, where he wrote 2 Timothy.",
    answer: "What is Rome?"
  },
  {
    category: "Worship & Service",
    question: "According to Matthew 24:14, this is what must happen before the end comes.",
    answer: "What is the good news of the Kingdom being preached in all the inhabited earth for a witness?"
  },
  {
    category: "Divine Names",
    question: "The divine name Jehovah appears this many times in the original Hebrew Scriptures.",
    answer: "What is approximately 7,000 times?"
  }
];

// Get a random Final Jeopardy question
export function getRandomFinalJeopardyQuestion(): FinalJeopardyQuestion {
  return FINAL_JEOPARDY_QUESTIONS[Math.floor(Math.random() * FINAL_JEOPARDY_QUESTIONS.length)];
}
