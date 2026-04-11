/** ポイント計算とキーワード集計の純粋関数群 */
import type { Stats, Weights, Keyword, UserWordHistory } from '../types';
import type { LRUMap } from './memoryManager';

export function calcTotalPoints(stats: Stats, weights: Weights, keywords: Keyword[]): number {
  let total = 0;
  total += stats.likes * weights.likes;
  total += stats.superChats * weights.superChats;
  total += stats.superStickers * weights.superStickers;
  total += stats.memberJoins * weights.memberJoins;
  total += stats.memberMilestones * weights.memberMilestones;
  for (const kw of keywords) {
    if (kw.word) {
      total += (stats.keywords[kw.word] || 0) * kw.weight;
    }
  }
  return Math.round(total);
}

export interface KeywordUserEntry {
  authorId: string;
  name: string;
  count: number;
  rawCount: number;
}

export function buildKeywordUserData(
  activeKeywords: Keyword[],
  userWordHistory: LRUMap<UserWordHistory>,
  authorNames: LRUMap<string>,
): Record<string, KeywordUserEntry[]> {
  const result: Record<string, KeywordUserEntry[]> = {};
  for (const kw of activeKeywords) {
    result[kw.word] = [];
  }
  userWordHistory.forEach((history, authorId) => {
    for (const kw of activeKeywords) {
      const rawCount = history.rawCounts?.[kw.word] || 0;
      const count = history.keywordCounts[kw.word] || 0;
      if (rawCount > 0) {
        result[kw.word].push({
          authorId,
          name: authorNames.get(authorId) || authorId.slice(0, 12),
          count,
          rawCount,
        });
      }
    }
  });
  for (const word of Object.keys(result)) {
    result[word].sort((a, b) => b.rawCount - a.rawCount);
  }
  return result;
}
