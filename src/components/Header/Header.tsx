/** ページヘッダー。アプリタイトル、サブタイトル、テーマ切替ボタン */
import { useThemeStore } from '../../stores/useThemeStore';
import styles from './Header.module.css';

const SUN_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MOON_ICON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export function Header() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.icon}>&#9654;</span>
        <h1 className={styles.title}>YouTube Comment Counter</h1>
      </div>
      <p className={styles.subtitle}>ライブ配信のコメント・スパチャをリアルタイム集計</p>
      <button
        type="button"
        className={styles.themeToggle}
        onClick={toggleTheme}
        aria-label={isDark ? 'ライトモードに切替' : 'ダークモードに切替'}
        title={isDark ? 'ライトモードに切替' : 'ダークモードに切替'}
      >
        {isDark ? SUN_ICON : MOON_ICON}
      </button>
    </header>
  );
}
