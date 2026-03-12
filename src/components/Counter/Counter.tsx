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

interface UserEntry {
  authorId: string;
  name: string;
  count: number;
  rawCount: number;
}

export function StatsGrid() {
  const stats = useChatStore((s) => s.stats);
  const weights = useSettingsStore((s) => s.weights);
  const keywords = useSettingsStore((s) => s.keywords);
  const allowDuplicates = useSettingsStore((s) => s.allowKeywordDuplicates);
  const duplicateLimit = useSettingsStore((s) => s.keywordDuplicateLimit);
  const userWordHistory = useChatStore((s) => s.userWordHistory);
  const authorNames = useChatStore((s) => s.authorNames);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const activeKeywords = keywords.filter((kw) => kw.word);
  const limit = allowDuplicates ? duplicateLimit : 1;

  const keywordData = useMemo(() => {
    const result: Record<string, UserEntry[]> = {};
    for (const kw of activeKeywords) {
      result[kw.word] = [];
    }
    userWordHistory.forEach((history, authorId) => {
      for (const kw of activeKeywords) {
        const rawCount = history.rawCounts?.[kw.word] || 0;
        const count = history.keywordCounts[kw.word] || 0;
        if (rawCount > 0) {
          result[kw.word].push({ authorId, name: authorNames.get(authorId) || authorId.slice(0, 12), count, rawCount });
        }
      }
    });
    for (const word of Object.keys(result)) {
      result[word].sort((a, b) => b.rawCount - a.rawCount);
    }
    return result;
  }, [userWordHistory, activeKeywords, authorNames]);

  const statItems = [
    { label: 'スーパーチャット', value: stats.superChats, weight: weights.superChats, icon: '💰', prefix: '¥' },
    { label: 'スーパーステッカー', value: stats.superStickers, weight: weights.superStickers, icon: '🎨', prefix: '¥' },
    { label: 'メンバーシップ', value: stats.members, weight: weights.members, icon: '👑', prefix: '' },
    { label: '高評価', value: stats.likes, weight: weights.likes, icon: '👍', prefix: '' },
  ];

  const toggleKeyword = (word: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word); else next.add(word);
      return next;
    });
  };

  return (
    <div className={styles.statsTable}>
      <div className={styles.statsHeader}>
        <span className={styles.statsHeaderIcon} />
        <span className={styles.statsHeaderLabel}>項目</span>
        <span className={styles.statsHeaderNum}>件数</span>
        <span className={styles.statsHeaderWeight}>倍率</span>
        <span className={styles.statsHeaderPts}>ポイント</span>
        {activeKeywords.length > 0 && (
          <span className={styles.statsHeaderLimit}>上限: {allowDuplicates ? `${limit}回/人` : '1回/人'}</span>
        )}
      </div>
      {statItems.map((item) => {
        const pts = Math.round(item.value * item.weight * 100) / 100 || 0;
        return (
          <div key={item.label} className={styles.statsRow}>
            <span className={styles.statsRowIcon}>{item.icon}</span>
            <span className={styles.statsRowLabel}>{item.label}</span>
            <span className={styles.statsRowNum}>{item.prefix}{item.value.toLocaleString()}</span>
            <span className={styles.statsRowWeight}>×{item.weight}</span>
            <span className={styles.statsRowPts} style={{ color: pts > 0 ? 'var(--success)' : pts < 0 ? 'var(--accent)' : undefined }}>{pts.toLocaleString()}</span>
            {activeKeywords.length > 0 && <span className={styles.statsRowExtra} />}
          </div>
        );
      })}
      {activeKeywords.map((kw) => {
        const count = stats.keywords[kw.word] || 0;
        const pts = Math.round(count * kw.weight * 100) / 100 || 0;
        const users = keywordData[kw.word] || [];
        const isOpen = expanded.has(kw.word);
        const maxedOut = users.filter((u) => u.count >= limit).length;
        return (
          <div key={kw.word} className={styles.kwGroup}>
            <button className={styles.statsRowKeyword} onClick={() => toggleKeyword(kw.word)}>
              <span className={styles.statsRowIcon}>🔑</span>
              <span className={styles.statsRowLabel}>{kw.word}</span>
              <span className={styles.statsRowNum}>{count.toLocaleString()}</span>
              <span className={styles.statsRowWeight}>×{kw.weight}</span>
              <span className={styles.statsRowPts} style={{ color: pts > 0 ? 'var(--success)' : pts < 0 ? 'var(--accent)' : undefined }}>{pts.toLocaleString()}</span>
              <span className={styles.statsRowExtra}>
                <span className={styles.kwMeta}>
                  {users.length}人使用{maxedOut > 0 && <span className={styles.kwMaxed}> / {maxedOut}人上限</span>}
                </span>
                <span className={styles.kwArrow}>{isOpen ? '▲' : '▼'}</span>
              </span>
            </button>
            {isOpen && (
              <div className={styles.kwUsers}>
                {users.length === 0 ? (
                  <div className={styles.kwEmpty}>まだ使用者がいません</div>
                ) : (
                  <>
                    <div className={styles.kwUserHeader}>
                      <span className={styles.kwUserNameArea}>
                        <span className={styles.kwUserName}>ユーザー</span>
                        <span className={styles.kwUserCount}>使用</span>
                        <span className={styles.kwUserRemain}>残り</span>
                      </span>
                      <span className={styles.kwUserEffective}>有効</span>
                      <span className={styles.kwUserSpacer} />
                      <span className={styles.kwUserPts}>ポイント</span>
                    </div>
                    {users.map((u) => {
                      const effective = Math.min(u.count, limit);
                      const remaining = Math.max(0, limit - u.count);
                      const userPts = Math.round(effective * kw.weight * 100) / 100;
                      return (
                        <div key={u.authorId} className={`${styles.kwUserRow} ${remaining === 0 ? styles.kwUserMaxed : ''}`}>
                          <span className={styles.kwUserNameArea}>
                            <span className={styles.kwUserName}>{u.name}</span>
                            <span className={styles.kwUserCount}>{u.rawCount}</span>
                            <span className={`${styles.kwUserRemain} ${remaining === 0 ? styles.kwUserZero : ''}`}>{remaining}</span>
                          </span>
                          <span className={styles.kwUserEffective}>{effective}</span>
                          <span className={styles.kwUserSpacer} />
                          <span className={styles.kwUserPts}>{userPts.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
