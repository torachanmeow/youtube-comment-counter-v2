import type { Stats, Weights, Keyword } from '../types';

export function calcTotalPoints(stats: Stats, weights: Weights, keywords: Keyword[]): number {
  let total = 0;
  total += stats.likes * weights.likes;
  total += stats.superChats * weights.superChats;
  total += stats.superStickers * weights.superStickers;
  total += stats.members * weights.members;
  for (const kw of keywords) {
    if (kw.word) {
      total += (stats.keywords[kw.word] || 0) * kw.weight;
    }
  }
  return Math.round(total);
}
