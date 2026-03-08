// ── Chat & Message Types ──

export type MessageType = 'normal' | 'superChat' | 'superSticker' | 'membership' | 'membershipGift';

export interface ProcessedMessage {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  publishedAt: string;
  type: MessageType;
  highlights: string[];
  amount?: number;
  currency?: string;
  amountJPY?: number;
  contributions: {
    superChat: number;
    superSticker: number;
    membership: number;
    keywords: Record<string, number>;
  };
}

// ── Stats ──

export interface Stats {
  superChats: number;
  superStickers: number;
  members: number;
  likes: number;
  keywords: Record<string, number>;
}

// ── Settings ──

export interface Weights {
  likes: number;
  superChats: number;
  superStickers: number;
  members: number;
  keywords: Record<string, number>;
}

export interface Keyword {
  word: string;
  weight: number;
}

export interface StreamDesign {
  fontSize: number;
  fontFamily: string;
  textColor: string;
  bgColor: string;
  pointsOnly: boolean;
  label: string;
  animation: 'none' | 'countup' | 'bounce' | 'flip';
  letterSpacing: number;
  paddingX: number;
  paddingY: number;
}

export interface Settings {
  apiKey: string;
  videoId: string;
  pollingInterval: number;
  weights: Weights;
  keywords: Keyword[];
  allowKeywordDuplicates: boolean;
  keywordDuplicateLimit: number;
  streamDesign: StreamDesign;
  streamWindowWidth: number;
  streamWindowHeight: number;
  customExchangeRates: Record<string, number>;
}

// ── Video ──

export interface VideoDetails {
  title: string | null;
  channelTitle: string | null;
  publishedAt: string | null;
  likeCount: number;
}

export interface CurrencyInfo {
  symbol: string;
  country: string;
}

// ── YouTube API ──

export interface YouTubeAPIChatMessage {
  id: string;
  snippet: {
    displayMessage?: string;
    publishedAt: string;
    type?: string;
    superChatDetails?: {
      amountMicros?: string;
      amountDisplayString?: string;
      currency: string;
    };
    superStickerDetails?: {
      amountMicros?: string;
      amountDisplayString?: string;
      currency: string;
    };
    membershipGiftingDetails?: {
      giftMembershipsCount?: number;
    };
  };
  authorDetails: {
    channelId?: string;
    displayName?: string;
  };
}

export interface YouTubeVideoResponse {
  title: string | null;
  channelTitle: string | null;
  publishedAt: string | null;
  likeCount: number;
}

// ── User History ──

export interface UserWordHistory {
  keywordCounts: Record<string, number>;
  lastActive: number;
}
