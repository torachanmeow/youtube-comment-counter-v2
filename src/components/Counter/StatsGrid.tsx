/** 項目別統計テーブル。スパチャ・メンバーシップ・キーワードの件数・倍率・ポイントを表示 */
import { useState, useMemo } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { buildKeywordUserData } from '../../utils/points';
import styles from './Counter.module.css';

export function StatsGrid() {
  const stats = useChatStore((s) => s.stats);
  const weights = useSettingsStore((s) => s.weights);
  const keywords = useSettingsStore((s) => s.keywords);
  const allowDuplicates = useSettingsStore((s) => s.allowKeywordDuplicates);
  const duplicateLimit = useSettingsStore((s) => s.keywordDuplicateLimit);
  const userWordHistory = useChatStore((s) => s.userWordHistory);
  const authorNames = useChatStore((s) => s.authorNames);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const activeKeywords = useMemo(() => keywords.filter((kw) => kw.word), [keywords]);
  const limit = allowDuplicates ? duplicateLimit : 1;

  const keywordData = useMemo(
    () => buildKeywordUserData(activeKeywords, userWordHistory, authorNames),
    [activeKeywords, userWordHistory, authorNames],
  );

  const statItems = [
    { label: 'スーパーチャット', value: stats.superChats, weight: weights.superChats, icon: '💰', prefix: '¥' },
    { label: 'スーパーステッカー', value: stats.superStickers, weight: weights.superStickers, icon: '🎨', prefix: '¥' },
    { label: 'メンバーシップ（加入/ギフト）', value: stats.memberJoins, weight: weights.memberJoins, icon: '👑', prefix: '' },
    { label: 'メンバー継続記念', value: stats.memberMilestones, weight: weights.memberMilestones, icon: '🎖️', prefix: '' },
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
