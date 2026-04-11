/** OBS用ポイント表示ウィンドウ。別ウィンドウで開かれ、リアルタイムにポイントを描画する */
import { useEffect } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useChatStore, requestSync } from '../../stores/useChatStore';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import styles from './StreamWindow.module.css';

export function StreamWindow() {
  const design = useSettingsStore((s) => s.streamDesign);
  const displayPoints = useChatStore((s) => s.displayPoints);
  const { display, animKey } = useAnimatedValue(displayPoints, design.animation);

  useEffect(() => {
    document.title = 'OBS用ウィンドウ';
    requestSync();
  }, []);

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
