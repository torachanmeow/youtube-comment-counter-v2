export const CONFIG = {
  MAX_CHAT_LINES: 500,
  MAX_MESSAGE_IDS: 5000,
  USER_HISTORY_LIMIT: 2000,
  POLLING_TIMEOUT_MS: 10000,
  POLLING_INTERVAL_DEFAULT: 30,
  DEFAULT_DUPLICATE_LIMIT: 1,
  SLOWMODE_TRIGGER_COUNT: 3,
  SLOWMODE_MULTIPLIER: 3,
} as const;

export const DEFAULT_SETTINGS = {
  totalPointsFontSize: 30,
  totalPointsTextColor: '#c53030',
  totalPointsBgColor: '#fff5f5',
  totalPointsAnimation: 'none' as const,
  totalPointsLetterSpacing: 0,
  totalPointsPaddingX: 16,
  totalPointsPaddingY: 10,
  streamWindowWidth: 200,
  streamWindowHeight: 60,
  allowKeywordDuplicates: false,
  keywordDuplicateLimit: CONFIG.DEFAULT_DUPLICATE_LIMIT,
} as const;

export const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
export const EXCHANGE_RATE_API_URL = 'https://open.er-api.com/v6/latest/JPY';

export const STORAGE_KEYS = {
  SETTINGS: 'ycc-settings',
  EXCHANGE_RATE: 'ycc-exchange-rate',
} as const;

export const EXCHANGE_RATE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;
