import { useState, useMemo } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import styles from './Dashboard.module.css';

interface UserEntry {
  authorId: string;
  name: string;
  count: number;
}

export function KeywordUsers() {
  const userWordHistory = useChatStore((s) => s.userWordHistory);
  const keywords = useSettingsStore((s) => s.keywords);
  const allowDuplicates = useSettingsStore((s) => s.allowKeywordDuplicates);
  const duplicateLimit = useSettingsStore((s) => s.keywordDuplicateLimit);

  const activeKeywords = keywords.filter((kw) => kw.word);

  const authorNames = useChatStore((s) => s.authorNames);

  // Build per-keyword user lists
  const keywordData = useMemo(() => {
    const result: Record<string, UserEntry[]> = {};
    for (const kw of activeKeywords) {
      result[kw.word] = [];
    }
    userWordHistory.forEach((history, authorId) => {
      for (const kw of activeKeywords) {
        const count = history.keywordCounts[kw.word];
        if (count && count > 0) {
          result[kw.word].push({ authorId, name: authorNames.get(authorId) || authorId.slice(0, 12), count });
        }
      }
    });
    // Sort by count desc
    for (const word of Object.keys(result)) {
      result[word].sort((a, b) => b.count - a.count);
    }
    return result;
  }, [userWordHistory, activeKeywords, authorNames]);

  const limit = allowDuplicates ? duplicateLimit : 1;

  const [expanded, setExpanded] = useState<string | null>(null);

  if (activeKeywords.length === 0) return null;

  return (
    <div className={styles.kwSection}>
      <div className={styles.kwHeader}>
        <span className={styles.kwHeaderTitle}>キーワード使用状況</span>
        <span className={styles.kwHeaderSub}>上限: {allowDuplicates ? `${limit}回/人` : '1回/人（重複不可）'}</span>
      </div>
      {activeKeywords.map((kw) => {
        const users = keywordData[kw.word] || [];
        const isOpen = expanded === kw.word;
        const maxedOut = users.filter((u) => u.count >= limit).length;
        return (
          <div key={kw.word} className={styles.kwGroup}>
            <button
              className={styles.kwToggle}
              onClick={() => setExpanded(isOpen ? null : kw.word)}
            >
              <span className={styles.kwName}>🔑 {kw.word}</span>
              <span className={styles.kwSummary}>
                {users.length}人使用{maxedOut > 0 && <span className={styles.kwMaxed}> / {maxedOut}人上限到達</span>}
              </span>
              <span className={styles.kwArrow}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div className={styles.kwUsers}>
                {users.length === 0 ? (
                  <div className={styles.kwEmpty}>まだ使用者がいません</div>
                ) : (
                  <>
                    <div className={styles.kwUserHeader}>
                      <span className={styles.kwUserName}>ユーザー</span>
                      <span className={styles.kwUserNum}>使用回数</span>
                      <span className={styles.kwUserNum}>残り</span>
                    </div>
                    {users.map((u) => {
                      const remaining = Math.max(0, limit - u.count);
                      return (
                        <div key={u.authorId} className={`${styles.kwUserRow} ${remaining === 0 ? styles.kwUserMaxed : ''}`}>
                          <span className={styles.kwUserName}>{u.name}</span>
                          <span className={styles.kwUserNum}>{u.count}</span>
                          <span className={`${styles.kwUserNum} ${remaining === 0 ? styles.kwUserZero : ''}`}>{remaining}</span>
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
