/** テーマ切替ストア。light/darkをlocalStorageに永続化し、data-theme属性を更新する */
// CSR専用。モジュールロード時に document へアクセスするため SSR 非対応。
import { create } from 'zustand';
import { createChannel, broadcast, subscribe } from '../utils/broadcast';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = 'ycc-theme';
const channel = createChannel('ycc-settings-sync');

function readInitialTheme(): Theme {
  const fromAttr = document.documentElement.dataset.theme;
  if (fromAttr === 'dark' || fromAttr === 'light') return fromAttr;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // ignore
  }
  return 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

// 初回DOM反映。インラインスクリプトで既に data-theme が設定されていても冪等なので問題ない
const initialTheme = readInitialTheme();
applyTheme(initialTheme);

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  setTheme: (theme) => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore
    }
    set({ theme });
    broadcast(channel, 'THEME_UPDATE', theme);
  },
  toggleTheme: () => {
    const next: Theme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(next);
  },
}));

if (channel) {
  subscribe(channel, (msg) => {
    if (msg.type !== 'THEME_UPDATE') return;
    const t = msg.payload;
    if (t !== 'dark' && t !== 'light') return;
    applyTheme(t);
    useThemeStore.setState({ theme: t });
  });
}
