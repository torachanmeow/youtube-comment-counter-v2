/** ポイントカウンター表示。合計ポイント・差分・ステータス・次回取得カウントダウンを表示 */
import { useEffect, useState } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTotalPoints } from '../../hooks/useTotalPoints';
import styles from './Counter.module.css';

interface Props {
  lastFetchTime: string;
  isRunning: boolean;
  status: string;
  isSlowMode: boolean;
  onOpenStreamWindow: () => void;
}

export function Counter({ lastFetchTime, isRunning, status, isSlowMode, onOpenStreamWindow }: Props) {
  const videoDetails = useChatStore((s) => s.videoDetails);
  const publishDisplayPoints = useChatStore((s) => s.publishDisplayPoints);
  const pollingInterval = useSettingsStore((s) => s.pollingInterval);

  const { totalPoints, diff } = useTotalPoints();
  const [nextFetchIn, setNextFetchIn] = useState(pollingInterval);

  useEffect(() => {
    publishDisplayPoints(totalPoints);
  }, [totalPoints, publishDisplayPoints]);

  useEffect(() => {
    if (!isRunning) { setNextFetchIn(pollingInterval); return; }
    setNextFetchIn(pollingInterval);
    const timer = setInterval(() => setNextFetchIn((p) => Math.max(0, p - 1)), 1000);
    return () => clearInterval(timer);
  }, [lastFetchTime, pollingInterval, isRunning]);

  return (
    <div className={styles.counterCard}>
      <div className={styles.counterCardHeader}>
        <button className={styles.streamBtn} onClick={onOpenStreamWindow}>
          &#128250; OBS用ウィンドウを開く
        </button>
      </div>
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
  );
}
