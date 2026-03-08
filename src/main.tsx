import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App';
import { StreamWindow } from './components/Stream/StreamWindow';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { useChatStore } from './stores/useChatStore';
import { useSettingsStore } from './stores/useSettingsStore';

// debug: expose stores to devtools console
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).__chatStore = useChatStore;
  (window as unknown as Record<string, unknown>).__settingsStore = useSettingsStore;
}

function Root() {
  const isStream = window.location.hash === '#/stream';
  return isStream ? <StreamWindow /> : <App />;
}

// Select all on focus for number/text inputs
document.addEventListener('focus', (e) => {
  const el = e.target;
  if (el instanceof HTMLInputElement && (el.type === 'number' || el.type === 'text')) {
    el.select();
  }
}, true);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  </StrictMode>,
);
