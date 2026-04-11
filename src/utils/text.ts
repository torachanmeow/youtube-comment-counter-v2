/** テキスト処理ユーティリティ。HTMLストリップ・YouTube動画IDパース・時刻フォーマットなど */
// YouTube API の displayMessage 用の軽量タグ除去。属性内の `>` は想定しない。
// 最終描画は React が自動エスケープするため XSS 対策ではなく、キーワード検出の雑音除去が目的。
export function stripHTML(str: string): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '');
}

export function parseVideoId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}
