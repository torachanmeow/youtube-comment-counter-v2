import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CircularBuffer, LRUSet, LRUMap } from '../utils/memoryManager';
import { CONFIG } from '../utils/constants';
import { createChannel, broadcast, subscribe } from '../utils/broadcast';
import type { Stats, ProcessedMessage, VideoDetails, CurrencyInfo, UserWordHistory } from '../types';

const channel = createChannel();

interface StatsAdditions {
  superChats?: number;
  superStickers?: number;
  members?: number;
  likes?: number;
  keywords?: Record<string, number>;
}

interface ChatState {
  stats: Stats;
  previousStats: Stats;
  chatLogs: CircularBuffer<ProcessedMessage>;
  videoDetails: VideoDetails | null;
  messageIds: LRUSet;
  userWordHistory: LRUMap<UserWordHistory>;
  authorNames: LRUMap<string>;
  currencyInfo: Record<string, CurrencyInfo>;
  exchangeRates: Record<string, number>;
  fetchCount: number;

  addStatsBatch: (additions: StatsAdditions) => void;
  saveSnapshot: () => void;
  addChatMessage: (msg: ProcessedMessage) => boolean;
  updateVideoDetails: (details: VideoDetails) => void;
  setCurrencyInfo: (info: Record<string, CurrencyInfo>) => void;
  setExchangeRates: (rates: Record<string, number>) => void;
  updateUserWordHistory: (authorId: string, word: string, effectiveCount: number, rawCount: number) => void;
  incrementFetchCount: () => void;
  resetData: (fromBroadcast?: boolean) => void;
}

const EMPTY_STATS: Stats = { superChats: 0, superStickers: 0, members: 0, likes: 0, keywords: {} };

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      stats: { ...EMPTY_STATS },
      previousStats: { ...EMPTY_STATS },
      chatLogs: new CircularBuffer(CONFIG.MAX_CHAT_LINES),
      videoDetails: null,
      messageIds: new LRUSet(CONFIG.MAX_MESSAGE_IDS),
      userWordHistory: new LRUMap(CONFIG.USER_HISTORY_LIMIT),
      authorNames: new LRUMap<string>(CONFIG.USER_HISTORY_LIMIT),
      currencyInfo: {},
      exchangeRates: {},
      fetchCount: 0,

      addStatsBatch: (additions) => {
        set((state) => {
          const kw = { ...state.stats.keywords };
          if (additions.keywords) {
            for (const [word, count] of Object.entries(additions.keywords)) {
              kw[word] = (kw[word] || 0) + count;
            }
          }
          const stats: Stats = {
            superChats: state.stats.superChats + (additions.superChats || 0),
            superStickers: state.stats.superStickers + (additions.superStickers || 0),
            members: state.stats.members + (additions.members || 0),
            likes: additions.likes !== undefined ? additions.likes : state.stats.likes,
            keywords: kw,
          };
          broadcast(channel, 'STATS_UPDATE', stats);
          return { stats };
        });
      },

      saveSnapshot: () => set((s) => ({ previousStats: { ...s.stats, keywords: { ...s.stats.keywords } } })),

      addChatMessage: (msg) => {
        const state = get();
        if (state.messageIds.has(msg.id)) return false;

        const newIds = new LRUSet(state.messageIds.maxSize);
        state.messageIds.forEach((key) => newIds.add(key));
        newIds.add(msg.id);

        const newLogs = new CircularBuffer<ProcessedMessage>(state.chatLogs.maxSize);
        state.chatLogs.forEach((item) => newLogs.push(item));
        newLogs.push(msg);

        // Cache author name persistently
        let authorNames = state.authorNames;
        if (msg.authorId && msg.authorName) {
          const existing = authorNames.get(msg.authorId);
          if (existing !== msg.authorName) {
            authorNames = new LRUMap<string>(state.authorNames.maxSize);
            state.authorNames.forEach((v, k) => authorNames.set(k, v));
            authorNames.set(msg.authorId, msg.authorName);
          }
        }

        set({ messageIds: newIds, chatLogs: newLogs, authorNames });
        return true;
      },

      updateVideoDetails: (details) => set({ videoDetails: details }),
      setCurrencyInfo: (currencyInfo) => set({ currencyInfo }),
      setExchangeRates: (exchangeRates) => set({ exchangeRates }),

      incrementFetchCount: () => set((s) => ({ fetchCount: s.fetchCount + 1 })),

      updateUserWordHistory: (authorId, word, effectiveCount, rawCount) => {
        const state = get();
        const prev = state.userWordHistory.get(authorId) || { keywordCounts: {}, rawCounts: {}, lastActive: 0 };
        const updated: UserWordHistory = {
          keywordCounts: { ...prev.keywordCounts, [word]: (prev.keywordCounts[word] || 0) + effectiveCount },
          rawCounts: { ...prev.rawCounts, [word]: (prev.rawCounts[word] || 0) + rawCount },
          lastActive: Date.now(),
        };
        const newHistory = new LRUMap<UserWordHistory>(state.userWordHistory.maxSize);
        state.userWordHistory.forEach((v, k) => newHistory.set(k, v));
        newHistory.set(authorId, updated);
        set({ userWordHistory: newHistory });
      },

      resetData: (fromBroadcast = false) => {
        if (!fromBroadcast) broadcast(channel, 'RESET_DATA', null);
        set({
          stats: { ...EMPTY_STATS },
          previousStats: { ...EMPTY_STATS },
          chatLogs: new CircularBuffer(CONFIG.MAX_CHAT_LINES),
          videoDetails: null,
          messageIds: new LRUSet(CONFIG.MAX_MESSAGE_IDS),
          userWordHistory: new LRUMap(CONFIG.USER_HISTORY_LIMIT),
          authorNames: new LRUMap<string>(CONFIG.USER_HISTORY_LIMIT),
          fetchCount: 0,
        });
      },
    }),
    {
      name: 'ycc-chat-data',
      storage: createJSONStorage(() => localStorage),
      partialize: () => ({}),
    },
  ),
);

if (channel) {
  subscribe(channel, (msg) => {
    if (msg.type === 'STATS_UPDATE') {
      useChatStore.setState({ stats: msg.payload as Stats });
    } else if (msg.type === 'RESET_DATA') {
      useChatStore.getState().resetData(true);
    }
  });
}
