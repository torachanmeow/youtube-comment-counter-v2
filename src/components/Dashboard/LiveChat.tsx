import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import styles from './Dashboard.module.css';

const TYPE_STYLES: Record<string, string> = {
  superChat: styles.msgSuperChat,
  superSticker: styles.msgSuperSticker,
  membership: styles.msgMembership,
  membershipGift: styles.msgMembership,
};

const EMOJI_CODE_RE = /:[_a-zA-Z\u3000-\u9FFF\uF900-\uFAFF]+:/g;

/** テキスト内のキーワードをハイライト付きで分割（絵文字コード内は除外） */
function HighlightedText({ text, pattern }: { text: string; pattern: RegExp | null }) {
  if (!pattern) return <>{text}</>;

  // Split text into emoji-code segments (skip) and normal segments (highlight)
  const segments: { text: string; isEmoji: boolean }[] = [];
  let last = 0;
  let em: RegExpExecArray | null;
  EMOJI_CODE_RE.lastIndex = 0;
  while ((em = EMOJI_CODE_RE.exec(text)) !== null) {
    if (em.index > last) segments.push({ text: text.slice(last, em.index), isEmoji: false });
    segments.push({ text: em[0], isEmoji: true });
    last = EMOJI_CODE_RE.lastIndex;
  }
  if (last < text.length) segments.push({ text: text.slice(last), isEmoji: false });

  const parts: { text: string; match: boolean }[] = [];
  for (const seg of segments) {
    if (seg.isEmoji) {
      parts.push({ text: seg.text, match: false });
      continue;
    }
    let segLast = 0;
    let m: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((m = pattern.exec(seg.text)) !== null) {
      if (m.index > segLast) parts.push({ text: seg.text.slice(segLast, m.index), match: false });
      parts.push({ text: m[0], match: true });
      segLast = pattern.lastIndex;
      if (m[0].length === 0) break;
    }
    if (segLast < seg.text.length) parts.push({ text: seg.text.slice(segLast), match: false });
  }

  return (
    <>
      {parts.map((p, i) =>
        p.match ? (
          <span key={i} className={styles.chatKeyword}>{p.text}</span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

export function LiveChat() {
  const chatLogs = useChatStore((s) => s.chatLogs);
  const messages = chatLogs.getAll();
  const keywords = useSettingsStore((s) => s.keywords);
  const fetchCount = useChatStore((s) => s.fetchCount);

  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Track if user is at the bottom
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
  }, []);

  // Scroll to bottom on mount, then auto-scroll when at bottom
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      // Use rAF to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        const el = listRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
      return;
    }
    if (isAtBottomRef.current) {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages.length]);

  const keywordPattern = useMemo(() => {
    const words = keywords.map((kw) => kw.word).filter(Boolean);
    if (words.length === 0) return null;
    const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`(${escaped.join('|')})`, 'gi');
  }, [keywords]);

  return (
    <div className={styles.chatSection}>
      <div className={styles.chatHeader}>
        <h3 className={styles.chatTitle}>チャットログ</h3>
        <div className={styles.chatStats}>
          <span>{messages.length.toLocaleString()} 件</span>
          <span>取得 {fetchCount} 回</span>
        </div>
      </div>
      <div className={styles.chatList} ref={listRef} onScroll={handleScroll}>
        {messages.length === 0 && (
          <div className={styles.chatEmpty}>チャットメッセージがありません</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.chatMsg} ${TYPE_STYLES[msg.type] || ''}`}>
            <span className={styles.chatTime}>{formatTime(msg.publishedAt)}</span>
            <span className={styles.chatAuthor}>{msg.authorName}</span>
            <span className={styles.chatText}>
              <HighlightedText text={msg.text} pattern={keywordPattern} />
            </span>
            {msg.amount !== undefined && msg.currency && (
              <span className={styles.chatAmount}>
                [{msg.currency} {msg.amount.toLocaleString()}] =&gt; {msg.amountJPY?.toLocaleString()} 円
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
