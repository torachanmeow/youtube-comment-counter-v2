import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ padding: 40, textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#c53030', marginBottom: 12 }}>エラーが発生しました</h2>
        <p style={{ color: '#666', marginBottom: 8 }}>
          {this.state.error?.message || '予期しないエラーが発生しました'}
        </p>
        <p style={{ color: '#999', fontSize: 13, marginBottom: 20 }}>
          ブラウザのキャッシュをクリアして再度お試しください。
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 24px',
            background: '#c53030',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ページをリロード
        </button>
      </div>
    );
  }
}
