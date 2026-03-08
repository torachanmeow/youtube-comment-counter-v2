import { YOUTUBE_API_BASE_URL, CONFIG } from '../utils/constants';
import type { YouTubeAPIChatMessage, YouTubeVideoResponse } from '../types';

function classifyAPIError(status: number, message: string): string {
  if (status === 400) return `リクエストが不正です: ${message}`;
  if (status === 401) return 'APIキーが無効です。正しいAPIキーを入力してください。';
  if (status === 403) {
    if (/quota/i.test(message)) return 'YouTube APIの利用制限に達しました。しばらく待ってから再試行してください。';
    return 'アクセスが拒否されました。APIキーの権限を確認してください。';
  }
  if (status === 404) return 'リソースが見つかりません。動画IDを確認してください。';
  return message || `APIエラー (${status})`;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.POLLING_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const raw = data?.error?.message || data?.error?.errors?.[0]?.message || res.statusText;
      throw new Error(classifyAPIError(res.status, raw));
    }
    return await res.json();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('リクエストタイムアウト。ネットワーク接続を確認してください。');
    }
    if (err instanceof TypeError) {
      throw new Error('ネットワークに接続できません。接続状況を確認してください。');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function buildURL(path: string, params: Record<string, string>): string {
  const url = new URL(`${YOUTUBE_API_BASE_URL}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}

export async function getLiveChatId(apiKey: string, videoId: string): Promise<string> {
  const data = await fetchJSON<{
    items?: Array<{ liveStreamingDetails?: { activeLiveChatId?: string } }>;
  }>(buildURL('videos', { part: 'liveStreamingDetails', id: videoId, key: apiKey }));

  if (!data.items?.length) throw new Error('動画が見つかりません。動画IDを確認してください。');
  const chatId = data.items[0]?.liveStreamingDetails?.activeLiveChatId;
  if (!chatId) throw new Error('ライブチャットが無効または存在しません。配信中の動画か確認してください。');
  return chatId;
}

export async function getVideoDetails(
  apiKey: string,
  videoId: string,
  fetchSnippet = false,
): Promise<YouTubeVideoResponse> {
  const part = fetchSnippet ? 'snippet,statistics' : 'statistics';
  const data = await fetchJSON<{
    items?: Array<{
      snippet?: { title?: string; channelTitle?: string; publishedAt?: string };
      statistics?: { likeCount?: string };
    }>;
  }>(buildURL('videos', { part, id: videoId, key: apiKey }));

  if (!data.items?.length) throw new Error('動画情報が取得できません');

  const item = data.items[0];
  return {
    title: fetchSnippet ? (item.snippet?.title ?? null) : null,
    channelTitle: fetchSnippet ? (item.snippet?.channelTitle ?? null) : null,
    publishedAt: fetchSnippet ? (item.snippet?.publishedAt ?? null) : null,
    likeCount: parseInt(item.statistics?.likeCount || '0', 10),
  };
}

export async function getLiveChatMessages(
  apiKey: string,
  liveChatId: string,
  pageToken: string | null = null,
): Promise<{ messages: YouTubeAPIChatMessage[]; nextPageToken: string | null }> {
  const params: Record<string, string> = {
    liveChatId, part: 'snippet,authorDetails', maxResults: '500', key: apiKey,
  };
  if (pageToken) params.pageToken = pageToken;
  const url = buildURL('liveChat/messages', params);

  const data = await fetchJSON<{
    items?: YouTubeAPIChatMessage[];
    nextPageToken?: string;
  }>(url);

  const messages = (data.items || []).sort(
    (a, b) => new Date(a.snippet.publishedAt).getTime() - new Date(b.snippet.publishedAt).getTime(),
  );

  return { messages, nextPageToken: data.nextPageToken || null };
}
