import { useState, useCallback, useRef, useEffect } from 'react';
import { getLiveChatId, getVideoDetails, getLiveChatMessages } from '../services/youtubeAPI';
import { useChatStore } from '../stores/useChatStore';
import type { YouTubeAPIChatMessage, YouTubeVideoResponse } from '../types';

export function useYouTubeAPI(apiKey: string) {
  const [liveChatId, setLiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const apiKeyRef = useRef(apiKey);
  const pageTokenRef = useRef<string | null>(null);
  const updateVideoDetails = useChatStore((s) => s.updateVideoDetails);

  useEffect(() => {
    if (apiKeyRef.current !== apiKey) {
      apiKeyRef.current = apiKey;
      setLiveChatId(null);
      pageTokenRef.current = null;
      setError(null);
    }
  }, [apiKey]);

  const initializeLiveChat = useCallback(async (videoId: string): Promise<string | null> => {
    if (!apiKey || !videoId) {
      setError(new Error('API Key または Video ID が未設定です'));
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const chatId = await getLiveChatId(apiKey, videoId);
      setLiveChatId(chatId);
      pageTokenRef.current = null;
      return chatId;
    } catch (err) {
      setError(err as Error);
      setLiveChatId(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiKey]);

  const fetchVideoInfo = useCallback(async (
    videoId: string,
    fetchSnippet = false,
  ): Promise<YouTubeVideoResponse | null> => {
    if (!apiKey || !videoId) return null;
    try {
      const details = await getVideoDetails(apiKey, videoId, fetchSnippet);
      if (fetchSnippet) updateVideoDetails(details);
      return details;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [apiKey, updateVideoDetails]);

  const fetchChatMessages = useCallback(async (
    chatId?: string | null,
  ): Promise<YouTubeAPIChatMessage[]> => {
    const target = chatId || liveChatId;
    if (!target) return [];
    try {
      const result = await getLiveChatMessages(apiKey, target, pageTokenRef.current);
      pageTokenRef.current = result.nextPageToken;
      return result.messages;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [apiKey, liveChatId]);

  return { liveChatId, isLoading, error, initializeLiveChat, fetchVideoInfo, fetchChatMessages };
}
