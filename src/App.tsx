/** メイン画面のルートコンポーネント。タブ切り替え・OBSウィンドウ起動・全体レイアウトを管理 */
import { useState, useCallback } from 'react';
import { Header } from './components/Header/Header';
import { Controls } from './components/Controls/Controls';
import { Counter } from './components/Counter/Counter';
import { StatsGrid } from './components/Counter/StatsGrid';
import { Settings } from './components/Settings/Settings';
import { StreamSettings } from './components/Stream/StreamSettings';
import { LiveChat } from './components/Dashboard/LiveChat';
import { ExchangeRate } from './components/Dashboard/ExchangeRate';
import { ToastContainer } from './components/Toast/Toast';
import { useAppController } from './hooks/useAppController';
import { useSettingsStore } from './stores/useSettingsStore';
import { useChatStore } from './stores/useChatStore';
import { getOrCreateMainSessionId } from './utils/sessionId';
import styles from './App.module.css';

type Tab = 'settings' | 'stream' | 'dashboard' | 'exchange';

export default function App() {
  const [tab, setTab] = useState<Tab>('settings');
  const {
    status, lastFetchTime, isRunning, isActive, isPaused, isSlowMode,
    handleStart, handlePause, handleResume, handleStop, handleReset,
  } = useAppController();

  const fetchCount = useChatStore((s) => s.fetchCount);
  const streamWidth = useSettingsStore((s) => s.streamWindowWidth);
  const streamHeight = useSettingsStore((s) => s.streamWindowHeight);

  const openStreamWindow = useCallback(() => {
    const sid = getOrCreateMainSessionId();
    const url = `${window.location.origin}${window.location.pathname}#/stream?sid=${encodeURIComponent(sid)}`;
    const win = window.open(url, `ycc-stream-${sid}`, `width=${streamWidth},height=${streamHeight},menubar=no,toolbar=no,location=no,status=no`);
    if (win) {
      win.addEventListener('load', () => {
        const dw = streamWidth - win.innerWidth;
        const dh = streamHeight - win.innerHeight;
        if (dw !== 0 || dh !== 0) win.resizeBy(dw, dh);
      });
    }
  }, [streamWidth, streamHeight]);

  return (
    <div className={styles.app}>
      <Header />

      <Controls
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStop={handleStop}
        onReset={handleReset}
        isRunning={isRunning}
        isPaused={isPaused}
        hasData={fetchCount > 0}
      />

      <Counter lastFetchTime={lastFetchTime} isRunning={isRunning} status={status} isSlowMode={isSlowMode} onOpenStreamWindow={openStreamWindow} />

      <div className={styles.quickStart}>
        <div className={styles.quickStartTitle}>クイックスタート</div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepText}>API設定</span>
          </div>
          <span className={styles.stepArrow}>→</span>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepText}>ポイント設定</span>
          </div>
          <span className={styles.stepArrow}>→</span>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span className={styles.stepText}>開始</span>
          </div>
          <span className={styles.stepArrow}>→</span>
          <div className={styles.step}>
            <span className={styles.stepNum}>4</span>
            <span className={styles.stepText}>OBSウィンドウを開く</span>
          </div>
        </div>
        <p className={styles.quickStartNote}>
          配信中はこの画面を開いたままにしてください。OBS用ウィンドウのポイントが自動で更新されます。<br />
          ※ 画面を閉じると更新が停止します。最小化・タブ切り替えは問題ありません。
        </p>
      </div>

      <nav className={styles.tabs}>
        {([
          ['settings', '設定'],
          ['stream', 'OBS設定'],
          ['dashboard', 'ダッシュボード'],
          ['exchange', '為替レート'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className={styles.tabContent}>
        {tab === 'settings' && <Settings isLocked={isActive} />}
        {tab === 'stream' && <StreamSettings />}
        {tab === 'dashboard' && <><StatsGrid /><LiveChat /></>}
        {tab === 'exchange' && <ExchangeRate />}
      </div>

      <ToastContainer />
    </div>
  );
}
