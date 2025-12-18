import { kidsTriviaQuestions } from '@games/kids-trivia/questions';
import type { KidsTriviaDifficulty } from '../types/game';

export function pickNextQuestionId(params: { difficulty: KidsTriviaDifficulty; usedQuestionIds: string[] }): string {
  const all = kidsTriviaQuestions.filter((q) => q.difficulty === params.difficulty);
  const used = new Set(params.usedQuestionIds);
  const available = all.filter((q) => !used.has(q.id));
  const pool = available.length > 0 ? available : all;
  return pool[Math.floor(Math.random() * pool.length)]?.id ?? kidsTriviaQuestions[0]!.id;
}

