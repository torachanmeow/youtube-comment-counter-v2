import { useState, useCallback } from 'react';
import { Header } from './components/Header/Header';
import { Controls } from './components/Controls/Controls';
import { Counter, StatsGrid } from './components/Counter/Counter';
import { Settings } from './components/Settings/Settings';
import { StreamSettings } from './components/Stream/StreamSettings';
import { LiveChat } from './components/Dashboard/LiveChat';
import { KeywordUsers } from './components/Dashboard/KeywordUsers';
import { ExchangeRate } from './components/Dashboard/ExchangeRate';
import { ToastContainer } from './components/Toast/Toast';
import { useAppController } from './hooks/useAppController';
import { useSettingsStore } from './stores/useSettingsStore';
import { useChatStore } from './stores/useChatStore';
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
    const url = `${window.location.href}#/stream`;
    const win = window.open(url, 'stream', `width=${streamWidth},height=${streamHeight},menubar=no,toolbar=no,location=no,status=no`);
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

      <div className={styles.topRow}>
        <Counter lastFetchTime={lastFetchTime} isRunning={isRunning} status={status} isSlowMode={isSlowMode} />
      </div>

      <div className={styles.navRow}>
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
        <button className={styles.streamBtn} onClick={openStreamWindow}>
          &#128250; OBS用ウィンドウを開く
        </button>
      </div>

      <div className={styles.tabContent}>
        {tab === 'settings' && <Settings isLocked={isActive} />}
        {tab === 'stream' && <StreamSettings />}
        {tab === 'dashboard' && <><StatsGrid /><KeywordUsers /><LiveChat /></>}
        {tab === 'exchange' && <ExchangeRate />}
      </div>

      <ToastContainer />
    </div>
  );
}
