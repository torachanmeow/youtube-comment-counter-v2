import { useState, useCallback } from 'react';
import { useYouTubeAPI } from './useYouTubeAPI';
import { usePolling } from './usePolling';
import { useChatProcessor } from './useChatProcessor';
import { useExchangeRate } from './useExchangeRate';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useChatStore } from '../stores/useChatStore';
import { showToast } from '../components/Toast/Toast';

export function useAppController() {
  const [status, setStatus] = useState('');
  const [lastFetchTime, setLastFetchTime] = useState('00:00:00');

  const apiKey = useSettingsStore((s) => s.apiKey);
  const videoId = useSettingsStore((s) => s.videoId);
  const pollingInterval = useSettingsStore((s) => s.pollingInterval);

  const resetData = useChatStore((s) => s.resetData);
  const updateVideoDetails = useChatStore((s) => s.updateVideoDetails);
  const saveSnapshot = useChatStore((s) => s.saveSnapshot);
  const incrementFetchCount = useChatStore((s) => s.incrementFetchCount);

  const { initializeLiveChat, fetchVideoInfo, fetchChatMessages } = useYouTubeAPI(apiKey);
  const { processMessages } = useChatProcessor();
  const { exchangeRates, initialize: initializeExchangeRates } = useExchangeRate();

  const handlePollingTick = useCallback(async () => {
    try {
      saveSnapshot();
      const [messages, videoDetails] = await Promise.all([
        fetchChatMessages(),
        fetchVideoInfo(videoId),
      ]);
      processMessages(messages, { likes: videoDetails?.likeCount });
      incrementFetchCount();
      setLastFetchTime(new Date().toLocaleTimeString('ja-JP'));
      return messages.length > 0 ? messages[messages.length - 1].id : null;
    } catch (error) {
      const err = error as Error;
      const msg = err.message || 'ポーリング中に問題が発生しました';
      setStatus(`エラー: ${msg}`);
      showToast(msg, 'error');
      pause();
      return null;
    }
  }, [fetchChatMessages, fetchVideoInfo, videoId, processMessages, saveSnapshot, incrementFetchCount]);

  const { start, pause, resume, stop, isRunning, isActive, isPaused, isSlowMode } = usePolling(
    handlePollingTick,
    pollingInterval,
  );

  const handleStart = useCallback(async () => {
    if (!apiKey || !videoId) {
      setStatus('APIキーと動画IDを入力してください');
      return;
    }

    try {
      setStatus('ライブチャット取得中...');
      resetData();

      if (Object.keys(exchangeRates).length === 0) {
        await initializeExchangeRates();
      }

      const details = await fetchVideoInfo(videoId, true);
      if (details) updateVideoDetails(details);

      const liveChatId = await initializeLiveChat(videoId);
      if (!liveChatId) throw new Error('ライブチャットIDを取得できませんでした');

      try {
        const initialMessages = await fetchChatMessages(liveChatId);
        processMessages(initialMessages, { likes: details?.likeCount });
        incrementFetchCount();
        setLastFetchTime(new Date().toLocaleTimeString('ja-JP'));
      } catch {
        // initial fetch can fail silently
      }

      start();
      setStatus('実行中');
      showToast('ポーリングを開始しました', 'success');
    } catch (error) {
      const err = error as Error;
      const msg = err.message || '開始中にエラーが発生しました';
      setStatus(`エラー: ${msg}`);
      showToast(msg, 'error');
    }
  }, [apiKey, videoId, fetchVideoInfo, initializeLiveChat, fetchChatMessages, updateVideoDetails, start, processMessages, exchangeRates, initializeExchangeRates, resetData, incrementFetchCount]);

  const handlePause = useCallback(() => {
    pause();
    setStatus('一時停止中');
  }, [pause]);

  const handleResume = useCallback(() => {
    resume();
    setStatus('実行中');
  }, [resume]);

  const handleStop = useCallback(() => {
    stop();
    setStatus('停止');
  }, [stop]);

  const handleReset = useCallback(() => {
    stop();
    resetData();
    setStatus('');
    setLastFetchTime('00:00:00');
  }, [stop, resetData]);

  return {
    status, lastFetchTime, isRunning, isActive, isPaused, isSlowMode,
    handleStart, handlePause, handleResume, handleStop, handleReset,
  };
}
