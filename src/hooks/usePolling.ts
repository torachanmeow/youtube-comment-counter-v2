import { useState, useRef, useCallback, useEffect } from 'react';
import { CONFIG } from '../utils/constants';

export type PollingStatus = 'idle' | 'running' | 'paused' | 'slowmode';

export function usePolling(
  pollCallback: () => Promise<string | null>,
  defaultInterval: number = CONFIG.POLLING_INTERVAL_DEFAULT,
) {
  const [status, setStatus] = useState<PollingStatus>('idle');
  const [currentInterval, setCurrentInterval] = useState(defaultInterval);

  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastIdRef = useRef<string | null>(null);
  const silentRef = useRef(0);
  const baseRef = useRef(defaultInterval);
  const slowRef = useRef(false);
  const statusRef = useRef<PollingStatus>('idle');
  const cbRef = useRef(pollCallback);
  const busyRef = useRef(false);

  useEffect(() => { cbRef.current = pollCallback; }, [pollCallback]);
  useEffect(() => { statusRef.current = status; }, [status]);

  const schedule = useCallback((sec: number) => {
    if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    intervalIdRef.current = setInterval(executePoll, sec * 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const executePoll = useCallback(async () => {
    if (statusRef.current === 'paused' || busyRef.current) return;
    busyRef.current = true;
    try {
      const latestId = await cbRef.current();
      if (latestId && latestId !== lastIdRef.current) {
        silentRef.current = 0;
        lastIdRef.current = latestId;
        if (slowRef.current) {
          slowRef.current = false;
          setCurrentInterval(baseRef.current);
          setStatus('running');
          schedule(baseRef.current);
        } else {
          setStatus('running');
        }
      } else {
        silentRef.current++;
        if (!slowRef.current && silentRef.current >= CONFIG.SLOWMODE_TRIGGER_COUNT) {
          slowRef.current = true;
          const slow = baseRef.current * CONFIG.SLOWMODE_MULTIPLIER;
          setCurrentInterval(slow);
          setStatus('slowmode');
          schedule(slow);
        }
      }
    } finally {
      busyRef.current = false;
    }
  }, [schedule]);

  const start = useCallback(() => {
    if (statusRef.current === 'running' || statusRef.current === 'slowmode') return;
    lastIdRef.current = null;
    silentRef.current = 0;
    slowRef.current = false;
    baseRef.current = defaultInterval;
    setCurrentInterval(defaultInterval);
    setStatus('running');
    schedule(defaultInterval);
  }, [defaultInterval, schedule]);

  const pause = useCallback(() => {
    if (statusRef.current === 'running' || statusRef.current === 'slowmode') {
      setStatus('paused');
    }
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    if (slowRef.current) {
      slowRef.current = false;
      setCurrentInterval(baseRef.current);
      schedule(baseRef.current);
    }
    setStatus('running');
  }, [schedule]);

  const stop = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    lastIdRef.current = null;
    silentRef.current = 0;
    slowRef.current = false;
    busyRef.current = false;
    setCurrentInterval(defaultInterval);
    setStatus('idle');
  }, [defaultInterval]);

  useEffect(() => {
    return () => { if (intervalIdRef.current) clearInterval(intervalIdRef.current); };
  }, []);

  return {
    status, currentInterval, start, pause, resume, stop,
    isRunning: status === 'running' || status === 'slowmode',
    isActive: status !== 'idle',
    isPaused: status === 'paused',
    isSlowMode: status === 'slowmode',
  };
}
