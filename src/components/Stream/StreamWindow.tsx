import { useMemo, useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { calcTotalPoints } from '../../utils/points';
import styles from './StreamWindow.module.css';

export function StreamWindow() {
  const stats = useChatStore((s) => s.stats);
  const design = useSettingsStore((s) => s.streamDesign);
  const keywords = useSettingsStore((s) => s.keywords);
  const weights = useSettingsStore((s) => s.weights);

  const totalPoints = useMemo(() => calcTotalPoints(stats, weights, keywords), [stats, weights, keywords]);

  const [display, setDisplay] = useState(totalPoints);
  const prevRef = useRef(totalPoints);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = totalPoints;
    prevRef.current = totalPoints;
    if (from === to) return;

    // Trigger CSS animation for bounce/flip
    if (design.animation === 'bounce' || design.animation === 'flip') {
      setAnimKey((k) => k + 1);
    }

    if (design.animation === 'countup') {
      const start = performance.now();
      function tick(now: number) {
        const p = Math.min((now - start) / 1000, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setDisplay(Math.round(from + (to - from) * eased));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    } else {
      setDisplay(to);
    }
  }, [totalPoints, design.animation]);

  useEffect(() => { document.title = 'OBS用ウィンドウ'; }, []);

  useEffect(() => {
    const check = setInterval(() => {
      if (!window.opener || window.opener.closed) window.close();
    }, 1000);
    return () => clearInterval(check);
  }, []);

  const animClass = (design.animation === 'bounce' || design.animation === 'flip')
    ? styles[design.animation]
    : undefined;

  return (
    <div
      className={styles.streamWindow}
      style={{
        background: design.bgColor,
        color: design.textColor,
        fontFamily: design.fontFamily,
        fontSize: `${design.fontSize}px`,
        letterSpacing: `${design.letterSpacing}px`,
        paddingLeft: `${design.paddingX}px`,
        paddingRight: `${design.paddingX}px`,
        paddingTop: `${design.paddingY}px`,
        paddingBottom: `${design.paddingY}px`,
      }}
    >
      {!design.pointsOnly && (design.label ?? 'POINT') && <span className={styles.label} style={{ left: `${design.paddingX}px`, top: `${design.paddingY + 6}px` }}>{design.label ?? 'POINT'}</span>}
      <span key={animKey} className={`${design.pointsOnly ? styles.valueCenter : styles.value} ${animClass || ''}`}>{display}</span>
    </div>
  );
}
