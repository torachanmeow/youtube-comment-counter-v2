import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CONFIG, DEFAULT_SETTINGS, STORAGE_KEYS } from '../utils/constants';
import { createChannel, broadcast, subscribe } from '../utils/broadcast';
import type { Settings, StreamDesign } from '../types';

const channel = createChannel();

interface SettingsActions {
  setApiKey: (v: string) => void;
  setVideoId: (v: string) => void;
  setPollingInterval: (v: number) => void;
  updateWeight: (type: string, value: number) => void;
  updateKeywordWeight: (word: string, weight: number) => void;
  addKeyword: (word: string, weight: number) => void;
  removeKeyword: (index: number) => void;
  updateStreamDesign: (updates: Partial<StreamDesign>) => void;
  updateCountRule: (allowDuplicates: boolean, limit: number) => void;
  setStreamWindowSize: (width: number, height: number) => void;
  setCustomExchangeRates: (rates: Record<string, number>) => void;
  resetToDefaults: () => void;
}

const INITIAL: Settings = {
  apiKey: '',
  videoId: '',
  pollingInterval: CONFIG.POLLING_INTERVAL_DEFAULT,
  weights: { likes: 0, superChats: 0, superStickers: 0, members: 0, keywords: {} },
  keywords: Array.from({ length: 10 }, () => ({ word: '', weight: 0 })),
  allowKeywordDuplicates: DEFAULT_SETTINGS.allowKeywordDuplicates,
  keywordDuplicateLimit: DEFAULT_SETTINGS.keywordDuplicateLimit,
  streamDesign: {
    fontSize: DEFAULT_SETTINGS.totalPointsFontSize,
    textColor: DEFAULT_SETTINGS.totalPointsTextColor,
    bgColor: DEFAULT_SETTINGS.totalPointsBgColor,
    fontFamily: '"Noto Sans JP", sans-serif',
    pointsOnly: false,
    label: 'POINT',
    animation: DEFAULT_SETTINGS.totalPointsAnimation,
    letterSpacing: DEFAULT_SETTINGS.totalPointsLetterSpacing,
    paddingX: DEFAULT_SETTINGS.totalPointsPaddingX,
    paddingY: DEFAULT_SETTINGS.totalPointsPaddingY,
  },
  streamWindowWidth: DEFAULT_SETTINGS.streamWindowWidth,
  streamWindowHeight: DEFAULT_SETTINGS.streamWindowHeight,
  customExchangeRates: {},
};

function sync(type: string, payload: unknown) {
  broadcast(channel, type, payload);
}

export const useSettingsStore = create<Settings & SettingsActions>()(
  persist(
    (set, get) => ({
      ...INITIAL,

      setApiKey: (apiKey) => {
        set({ apiKey });
        sync('SETTINGS_UPDATE', { apiKey });
      },

      setVideoId: (videoId) => {
        set({ videoId });
        sync('SETTINGS_UPDATE', { videoId });
      },

      setPollingInterval: (interval) => {
        const pollingInterval = Math.max(10, Math.min(300, interval));
        set({ pollingInterval });
        sync('SETTINGS_UPDATE', { pollingInterval });
      },

      updateWeight: (type, value) => {
        const rounded = Math.round(value * 100) / 100;
        const weights = { ...get().weights, [type]: rounded };
        set({ weights });
        sync('SETTINGS_UPDATE', { weights });
      },

      updateKeywordWeight: (word, weight) => {
        const weights = {
          ...get().weights,
          keywords: { ...get().weights.keywords, [word]: weight },
        };
        set({ weights });
        sync('SETTINGS_UPDATE', { weights });
      },

      addKeyword: (word, weight) => {
        const state = get();
        if (state.keywords.length >= 10) return;
        const keywords = [...state.keywords, { word, weight }];
        const weights = {
          ...state.weights,
          keywords: { ...state.weights.keywords, [word]: weight },
        };
        set({ keywords, weights });
        sync('SETTINGS_UPDATE', { keywords, weights });
      },

      removeKeyword: (index) => {
        const state = get();
        const removed = state.keywords[index]?.word;
        const keywords = state.keywords.filter((_, i) => i !== index);
        const kwWeights = { ...state.weights.keywords };
        if (removed) delete kwWeights[removed];
        const weights = { ...state.weights, keywords: kwWeights };
        set({ keywords, weights });
        sync('SETTINGS_UPDATE', { keywords, weights });
      },

      updateStreamDesign: (updates) => {
        const streamDesign = { ...get().streamDesign, ...updates };
        set({ streamDesign });
        sync('SETTINGS_UPDATE', { streamDesign });
      },

      setStreamWindowSize: (width, height) => {
        const streamWindowWidth = Math.max(100, Math.min(1920, width));
        const streamWindowHeight = Math.max(50, Math.min(1080, height));
        set({ streamWindowWidth, streamWindowHeight });
        sync('SETTINGS_UPDATE', { streamWindowWidth, streamWindowHeight });
      },

      updateCountRule: (allowKeywordDuplicates, keywordDuplicateLimit) => {
        set({ allowKeywordDuplicates, keywordDuplicateLimit });
        sync('SETTINGS_UPDATE', { allowKeywordDuplicates, keywordDuplicateLimit });
      },

      setCustomExchangeRates: (customExchangeRates) => {
        set({ customExchangeRates });
        sync('SETTINGS_UPDATE', { customExchangeRates });
      },

      resetToDefaults: () => {
        const { apiKey, videoId } = get();
        set({ ...INITIAL, apiKey, videoId });
        sync('SETTINGS_RESET', null);
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      merge: (persisted, current) => {
        const p = persisted as Partial<Settings>;
        return {
          ...current,
          ...p,
          streamDesign: { ...(current as Settings).streamDesign, ...p.streamDesign },
          weights: { ...(current as Settings).weights, ...p.weights },
        };
      },
    },
  ),
);

// Tab sync
if (channel) {
  subscribe(channel, (msg) => {
    if (msg.type === 'SETTINGS_UPDATE') {
      useSettingsStore.setState(msg.payload as Partial<Settings>);
    } else if (msg.type === 'SETTINGS_RESET') {
      useSettingsStore.setState(INITIAL);
    }
  });
}
