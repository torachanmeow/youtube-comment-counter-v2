import styles from './Controls.module.css';

interface Props {
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onReset: () => void;
  isRunning: boolean;
  isPaused: boolean;
  hasData: boolean;
}

export function Controls({ onStart, onPause, onResume, onStop, onReset, isRunning, isPaused, hasData }: Props) {
  const isIdle = !isRunning && !isPaused;
  return (
    <div className={styles.controls}>
      <div className={styles.buttons}>
        {isIdle && (
          <button className={styles.startBtn} onClick={onStart}>
            &#9654; 開始
          </button>
        )}
        {isRunning && (
          <button className={styles.pauseBtn} onClick={onPause}>
            &#10074;&#10074; 一時停止
          </button>
        )}
        {isPaused && (
          <button className={styles.resumeBtn} onClick={onResume}>
            &#9654; 再開
          </button>
        )}
        {(isRunning || isPaused) && (
          <button className={styles.stopBtn} onClick={onStop}>
            &#9632; 停止
          </button>
        )}
        {isIdle && hasData && (
          <button className={styles.resetBtn} onClick={onReset}>
            &#8635; リセット
          </button>
        )}
      </div>
    </div>
  );
}
