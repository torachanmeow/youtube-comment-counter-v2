/** 数値変化のアニメーション（カウントアップ・バウンス・フリップ）を提供する共通フック */
import { useState, useEffect, useRef } from 'react';
import type { StreamDesign } from '../types';

export function useAnimatedValue(
  value: number,
  animation: StreamDesign['animation'],
): { display: number; animKey: number } {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to) {
      setDisplay(value);
      return;
    }

    if (animation === 'bounce' || animation === 'flip') {
      setAnimKey((k) => k + 1);
    }

    if (animation === 'countup') {
      const start = performance.now();
      let rafId: number;
      function tick(now: number) {
        const p = Math.min((now - start) / 1000, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setDisplay(Math.round(from + (to - from) * eased));
        if (p < 1) rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafId);
    } else {
      setDisplay(to);
    }
  }, [value, animation]);

  return { display, animKey };
}
