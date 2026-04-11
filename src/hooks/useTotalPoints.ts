/** 合計ポイントの算出。統計値と倍率から現在・前回・差分を返す共通フック */
import { useMemo } from 'react';
import { useChatStore } from '../stores/useChatStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { calcTotalPoints } from '../utils/points';

export function useTotalPoints() {
  const stats = useChatStore((s) => s.stats);
  const previousStats = useChatStore((s) => s.previousStats);
  const weights = useSettingsStore((s) => s.weights);
  const keywords = useSettingsStore((s) => s.keywords);

  const totalPoints = useMemo(
    () => calcTotalPoints(stats, weights, keywords),
    [stats, weights, keywords],
  );
  const prevTotalPoints = useMemo(
    () => calcTotalPoints(previousStats, weights, keywords),
    [previousStats, weights, keywords],
  );

  return { totalPoints, prevTotalPoints, diff: totalPoints - prevTotalPoints };
}
