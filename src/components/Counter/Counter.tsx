import { useMemo, useEffect, useState } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { calcTotalPoints } from '../../utils/points';
import styles from './Counter.module.css';

interface Props {
  lastFetchTime: string;
  isRunning: boolean;
  status: string;
  isSlowMode: boolean;
}

export function Counter({ lastFetchTime, isRunning, status, isSlowMode }: Props) {
  const stats = useChatStore((s) => s.stats);
  const previousStats = useChatStore((s) => s.previousStats);
  const videoDetails = useChatStore((s) => s.videoDetails);
  const weights = useSettingsStore((s) => s.weights);
  const keywords = useSettingsStore((s) => s.keywords);
  const pollingInterval = useSettingsStore((s) => s.pollingInterval);

  const [nextFetchIn, setNextFetchIn] = useState(pollingInterval);

  const totalPoints = useMemo(() => calcTotalPoints(stats, weights, keywords), [stats, weights, keywords]);
  const prevTotal = useMemo(() => calcTotalPoints(previousStats, weights, keywords), [previousStats, weights, keywords]);
  const diff = totalPoints - prevTotal;

  useEffect(() => {
    if (!isRunning) { setNextFetchIn(pollingInterval); return; }
    setNextFetchIn(pollingInterval);
    const timer = setInterval(() => setNextFetchIn((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [lastFetchTime, pollingInterval, isRunning]);

  return (
    <div className={styles.wrapper}>
      {/* Main Counter */}
      <div className={styles.counterCard}>
        <div className={styles.counterLabel}>
          合計ポイント
          {diff !== 0 && <span className={diff > 0 ? styles.diff : styles.diffMinus}>{diff > 0 ? '+' : ''}{diff.toLocaleString()}</span>}
        </div>
        <div className={styles.counterValue}>
          {totalPoints.toLocaleString()}
        </div>
        <div className={styles.counterMeta}>
          {status && (
            <span className={`${styles.statusBadge} ${
              status.startsWith('エラー') ? styles.statusError
              : status === '実行中' ? styles.statusRunning
              : status === '一時停止中' ? styles.statusPaused
              : styles.statusDefault
            }`}>
              {status === '実行中' && <span className={styles.statusDot} />}
              {isSlowMode && <span className={styles.slowBadge}>低速</span>}
              {status}
            </span>
          )}
          <span>最終取得: {lastFetchTime}</span>
          {isRunning && <span>次回: {nextFetchIn}秒後</span>}
        </div>
        {videoDetails?.title && (
          <div className={styles.videoInfo}>
            <div className={styles.videoTitle}>{videoDetails.title}</div>
            {videoDetails.channelTitle && <span className={styles.videoChannel}>{videoDetails.channelTitle}</span>}
          </div>
        )}
      </div>

    </div>
  );
}

export function StatsGrid() {
  const stats = useChatStore((s) => s.stats);
  const weights = useSettingsStore((s) => s.weights);
  const keywords = useSettingsStore((s) => s.keywords);

  const statItems = [
    { label: 'スーパーチャット', value: stats.superChats, weight: weights.superChats, icon: '💰', prefix: '¥' },
    { label: 'スーパーステッカー', value: stats.superStickers, weight: weights.superStickers, icon: '🎨', prefix: '¥' },
    { label: 'メンバーシップ', value: stats.members, weight: weights.members, icon: '👑', prefix: '' },
    { label: '高評価', value: stats.likes, weight: weights.likes, icon: '👍', prefix: '' },
  ];

  const activeKeywords = keywords.filter((kw) => kw.word);

  const allItems = [
    ...statItems.map((item) => ({
      icon: item.icon,
      label: item.label,
      count: item.value,
      weight: item.weight,
      prefix: item.prefix,
    })),
    ...activeKeywords.map((kw) => ({
      icon: '🔑',
      label: kw.word,
      count: stats.keywords[kw.word] || 0,
      weight: kw.weight,
      prefix: '',
    })),
  ];

  return (
    <div className={styles.statsTable}>
      <div className={styles.statsHeader}>
        <span className={styles.statsHeaderIcon} />
        <span className={styles.statsHeaderLabel}>項目</span>
        <span className={styles.statsHeaderNum}>件数</span>
        <span className={styles.statsHeaderNum}>倍率</span>
        <span className={styles.statsHeaderNum}>ポイント</span>
      </div>
      {allItems.map((item) => {
        const pts = Math.round(item.count * item.weight * 100) / 100;
        return (
          <div key={item.label} className={styles.statsRow}>
            <span className={styles.statsRowIcon}>{item.icon}</span>
            <span className={styles.statsRowLabel}>{item.label}</span>
            <span className={styles.statsRowNum}>{item.prefix}{item.count.toLocaleString()}</span>
            <span className={styles.statsRowWeight}>×{item.weight}</span>
            <span className={styles.statsRowPts} style={{ color: pts > 0 ? 'var(--success)' : pts < 0 ? 'var(--accent)' : undefined }}>{pts.toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );
}
