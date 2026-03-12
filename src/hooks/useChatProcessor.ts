import { useCallback } from 'react';
import { useChatStore } from '../stores/useChatStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { processMessage } from '../utils/messageProcessor';
import type { YouTubeAPIChatMessage, Stats } from '../types';

export function useChatProcessor() {
  const addStatsBatch = useChatStore((s) => s.addStatsBatch);
  const updateUserWordHistory = useChatStore((s) => s.updateUserWordHistory);
  const addChatMessage = useChatStore((s) => s.addChatMessage);

  const keywords = useSettingsStore((s) => s.keywords);
  const allowKeywordDuplicates = useSettingsStore((s) => s.allowKeywordDuplicates);
  const keywordDuplicateLimit = useSettingsStore((s) => s.keywordDuplicateLimit);

  const processMessages = useCallback(
    (messages: YouTubeAPIChatMessage[], initialStats: Partial<Stats> = {}): number => {
      const { exchangeRates } = useChatStore.getState();

      const accumulated = {
        superChats: 0,
        superStickers: 0,
        members: 0,
        likes: initialStats.likes,
        keywords: {} as Record<string, number>,
      };

      let count = 0;

      for (const msg of messages) {
        // Re-read userWordHistory each iteration so duplicate limits work within a batch
        const { userWordHistory } = useChatStore.getState();
        const ctx = {
          keywords,
          allowKeywordDuplicates,
          keywordDuplicateLimit,
          exchangeRates,
          userWordHistory,
        };

        const processed = processMessage(msg, ctx);
        if (!processed) continue;

        const added = addChatMessage(processed);
        if (!added) continue;

        accumulated.superChats += processed.contributions.superChat;
        accumulated.superStickers += processed.contributions.superSticker;
        accumulated.members += processed.contributions.membership;

        // Update raw counts for all matched keywords (even if capped to 0 effective)
        for (const [word, rawCount] of Object.entries(processed.contributions.rawKeywords)) {
          const effectiveCount = processed.contributions.keywords[word] || 0;
          if (effectiveCount > 0) {
            accumulated.keywords[word] = (accumulated.keywords[word] || 0) + effectiveCount;
          }
          updateUserWordHistory(processed.authorId, word, effectiveCount, rawCount);
        }

        count++;
      }

      addStatsBatch(accumulated);
      return count;
    },
    [addStatsBatch, updateUserWordHistory, addChatMessage, keywords, allowKeywordDuplicates, keywordDuplicateLimit],
  );

  return { processMessages };
}
