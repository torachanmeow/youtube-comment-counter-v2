import { sanitizeHTML } from './text';
import type {
  YouTubeAPIChatMessage,
  ProcessedMessage,
  Keyword,
  UserWordHistory,
} from '../types';
import type { LRUMap } from './memoryManager';

function convertToJPY(amount: number, currency: string, rates: Record<string, number>): number {
  const rate = rates[currency.toUpperCase()];
  if (!rate) return Math.round(amount);
  return Math.round(amount / rate + Number.EPSILON);
}

function parseAmount(micros?: string, display?: string): number {
  if (micros) return parseInt(micros, 10) / 1_000_000;
  if (display) return parseFloat(display.replace(/[^\d.-]/g, '')) || 0;
  return 0;
}

/** YouTube絵文字コード(:_text:)を除去してからキーワードを検出 */
function detectKeywords(text: string, keywords: Keyword[]): Record<string, number> {
  if (!text || !keywords.length) return {};
  const cleaned = text.replace(/:[_a-zA-Z\u3000-\u9FFF\uF900-\uFAFF]+:/g, '');
  const result: Record<string, number> = {};
  for (const { word } of keywords) {
    if (!word) continue;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = cleaned.match(new RegExp(escaped, 'gi'));
    if (matches) result[word] = matches.length;
  }
  return result;
}

function calcKeywordCount(
  authorId: string,
  word: string,
  matchCount: number,
  allowDuplicates: boolean,
  duplicateLimit: number,
  history: LRUMap<UserWordHistory>,
): number {
  const userHistory = history.get(authorId);
  const currentCount = userHistory?.keywordCounts?.[word] || 0;

  if (!allowDuplicates) {
    return currentCount > 0 ? 0 : 1;
  }
  return Math.min(matchCount, Math.max(0, duplicateLimit - currentCount));
}

export interface ProcessContext {
  keywords: Keyword[];
  allowKeywordDuplicates: boolean;
  keywordDuplicateLimit: number;
  exchangeRates: Record<string, number>;
  userWordHistory: LRUMap<UserWordHistory>;
}

export function processMessage(
  msg: YouTubeAPIChatMessage,
  ctx: ProcessContext,
): ProcessedMessage | null {
  if (!msg?.id || !msg.snippet) return null;

  const text = sanitizeHTML(msg.snippet.displayMessage || '');
  const authorId = msg.authorDetails?.channelId || '';

  const result: ProcessedMessage = {
    id: msg.id,
    authorId,
    authorName: msg.authorDetails?.displayName || 'Unknown',
    text,
    publishedAt: msg.snippet.publishedAt,
    type: 'normal',
    highlights: [],
    contributions: { superChat: 0, superSticker: 0, membership: 0, keywords: {} },
  };

  // SuperChat
  const sc = msg.snippet.superChatDetails;
  if (sc) {
    const amount = parseAmount(sc.amountMicros, sc.amountDisplayString);
    const jpy = convertToJPY(amount, sc.currency, ctx.exchangeRates);
    result.type = 'superChat';
    result.contributions.superChat = jpy;
    result.highlights.push('superChat');
    result.amount = amount;
    result.currency = sc.currency;
    result.amountJPY = jpy;
  }

  // SuperSticker
  const ss = msg.snippet.superStickerDetails;
  if (ss) {
    const amount = parseAmount(ss.amountMicros, ss.amountDisplayString);
    const jpy = convertToJPY(amount, ss.currency, ctx.exchangeRates);
    result.type = 'superSticker';
    result.contributions.superSticker = jpy;
    result.highlights.push('superSticker');
    result.amount = amount;
    result.currency = ss.currency;
    result.amountJPY = jpy;
  }

  // Membership
  const msgType = msg.snippet.type;
  if (msgType === 'newSponsorEvent') {
    result.type = 'membership';
    result.contributions.membership = 1;
    result.highlights.push('membership');
    const levelName = msg.snippet.newSponsorDetails?.memberLevelName || '不明';
    const isUpgrade = msg.snippet.newSponsorDetails?.isUpgrade;
    result.text = isUpgrade
      ? `メンバーシップアップグレード！（${levelName}）`
      : `新規メンバーシップ加入！（${levelName}）`;
  } else if (msgType === 'memberMilestoneChatEvent') {
    result.type = 'membership';
    result.contributions.membership = 1;
    result.highlights.push('membership');
  } else if (msgType === 'membershipGiftingEvent') {
    result.type = 'membershipGift';
    const giftCount = msg.snippet.membershipGiftingDetails?.giftMembershipsCount || 0;
    result.contributions.membership = giftCount;
    result.highlights.push('membership');
    const levelName = msg.snippet.membershipGiftingDetails?.giftMembershipsLevelName || '';
    result.text = levelName
      ? `${giftCount}名に「${levelName}」メンバーシップをギフト！`
      : `${giftCount}名にメンバーシップをギフト！`;
  } else if (msgType === 'giftMembershipReceivedEvent') {
    result.type = 'membership';
    result.contributions.membership = 0;
    result.highlights.push('membership');
    result.text = 'ギフトメンバーシップを受け取りました！';
  }

  // Keywords
  const matched = detectKeywords(text, ctx.keywords);
  for (const [word, matchCount] of Object.entries(matched)) {
    const count = calcKeywordCount(
      authorId, word, matchCount,
      ctx.allowKeywordDuplicates, ctx.keywordDuplicateLimit,
      ctx.userWordHistory,
    );
    if (count > 0) {
      result.contributions.keywords[word] = count;
      result.highlights.push(`keyword:${word}`);
    }
  }

  return result;
}
