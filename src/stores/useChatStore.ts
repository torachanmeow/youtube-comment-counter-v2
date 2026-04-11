/** チャットデータのグローバルストア。統計値・チャットログ・重複排除・タブ間同期を管理 */
import { create } from 'zustand';
import { CircularBuffer, LRUSet, LRUMap } from '../utils/memoryManager';
import { CONFIG } from '../utils/constants';
import { createChannel, broadcast, subscribe } from '../utils/broadcast';
import { resolveSessionId } from '../utils/sessionId';
import type { Stats, ProcessedMessage, VideoDetails, CurrencyInfo, UserWordHistory } from '../types';

const channel = createChannel(`ycc-stats-${resolveSessionId()}`);

interface StatsAdditions {
  superChats?: number;
  superStickers?: number;
  memberJoins?: number;
  memberMilestones?: number;
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
  displayPoints: number;

  addStatsBatch: (additions: StatsAdditions) => void;
  publishDisplayPoints: (points: number) => void;
  saveSnapshot: () => void;
  addChatMessage: (msg: ProcessedMessage) => boolean;
  updateVideoDetails: (details: VideoDetails) => void;
  setCurrencyInfo: (info: Record<string, CurrencyInfo>) => void;
  setExchangeRates: (rates: Record<string, number>) => void;
  updateUserWordHistory: (authorId: string, word: string, effectiveCount: number, rawCount: number) => void;
  incrementFetchCount: () => void;
  resetData: (fromBroadcast?: boolean) => void;
}

const EMPTY_STATS: Stats = { superChats: 0, superStickers: 0, memberJoins: 0, memberMilestones: 0, likes: 0, keywords: {} };

export const useChatStore = create<ChatState>()(
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
      displayPoints: 0,

      publishDisplayPoints: (points) => {
        if (get().displayPoints === points) return;
        broadcast(channel, 'DISPLAY_POINTS_UPDATE', points);
        set({ displayPoints: points });
      },

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
            memberJoins: state.stats.memberJoins + (additions.memberJoins || 0),
            memberMilestones: state.stats.memberMilestones + (additions.memberMilestones || 0),
            likes: additions.likes !== undefined ? additions.likes : state.stats.likes,
            keywords: kw,
          };
          return { stats };
        });
      },

      saveSnapshot: () => set((s) => ({ previousStats: { ...s.stats, keywords: { ...s.stats.keywords } } })),

      addChatMessage: (msg) => {
        const state = get();
        if (state.messageIds.has(msg.id)) return false;

        const newIds = state.messageIds.clone();
        newIds.add(msg.id);

        const newLogs = state.chatLogs.clone();
        newLogs.push(msg);

        let authorNames = state.authorNames;
        if (msg.authorId && msg.authorName) {
          if (authorNames.get(msg.authorId) !== msg.authorName) {
            authorNames = state.authorNames.clone();
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
        const newHistory = state.userWordHistory.clone();
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
          displayPoints: 0,
        });
      },
  }),
);

if (channel) {
  subscribe(channel, (msg) => {
    if (msg.type === 'DISPLAY_POINTS_UPDATE') {
      useChatStore.setState({ displayPoints: msg.payload as number });
    } else if (msg.type === 'RESET_DATA') {
      useChatStore.getState().resetData(true);
    } else if (msg.type === 'SYNC_REQUEST') {
      broadcast(channel, 'DISPLAY_POINTS_UPDATE', useChatStore.getState().displayPoints);
    }
  });
}

export function requestSync(): void {
  broadcast(channel, 'SYNC_REQUEST', null);
}
