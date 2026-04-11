/** メイン窓ごとのセッションIDを管理。stats/chat 同期チャンネルをペア限定にするためのキー */
const KEY = 'ycc-session-id';

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // fallthrough
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** OBS窓は `#/stream?sid=xxx` から sid を読み取る。メイン窓では null。 */
export function readSessionIdFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/[?&]sid=([^&]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

/** メイン窓のセッションIDを取得。タブ単位で sessionStorage に永続化。 */
export function getOrCreateMainSessionId(): string {
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id = newId();
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    return newId();
  }
}

/** 現在窓のセッションIDを解決。OBS窓ならハッシュから、メイン窓なら自分のIDを返す。 */
export function resolveSessionId(): string {
  return readSessionIdFromHash() ?? getOrCreateMainSessionId();
}
