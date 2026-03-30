import { useState, useMemo } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { useExchangeRate } from '../../hooks/useExchangeRate';
import { showToast } from '../Toast/Toast';
import styles from './ExchangeRate.module.css';

export function ExchangeRate() {
  const currencyInfo = useChatStore((s) => s.currencyInfo);
  const { exchangeRates, refresh, isLoading } = useExchangeRate();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let codes = Object.keys(currencyInfo);
    if (search.trim()) {
      const q = search.toLowerCase();
      codes = codes.filter((c) => {
        const info = currencyInfo[c];
        return c.toLowerCase().includes(q) || info.country.toLowerCase().includes(q);
      });
    }
    return codes.sort();
  }, [currencyInfo, search]);

  const handleRefresh = async () => {
    try {
      await refresh();
      showToast('為替レートを更新しました', 'success');
    } catch (err) {
      showToast((err as Error).message || '取得に失敗しました', 'error');
    }
  };

  return (
    <div className={styles.outer}>
      <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3 className={styles.title}>為替レート一覧</h3>
        <button className={styles.refreshBtn} onClick={handleRefresh} disabled={isLoading}>
          {isLoading ? '取得中...' : '最新レート取得'}
        </button>
      </div>
      <p className={styles.titleDesc}>外貨は日本円に換算して集計されます。<br />為替レートは7日ごとに自動更新されます。<br />即座に最新レートを取得したい場合は「最新レート取得」ボタンを押してください。</p>

      <input
        type="text"
        placeholder="通貨コードまたは国名で検索..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={styles.searchInput}
      />

      <div className={styles.rateList}>
        {filtered.map((code) => {
          const info = currencyInfo[code];
          const rate = exchangeRates[code];
          return (
            <div key={code} className={styles.rateRow}>
              <div className={styles.rateCode}>
                <span className={styles.codeName}>{code}</span>
                <span className={styles.codeSymbol}>{info.symbol}</span>
              </div>
              <div className={styles.rateCountry}>{info.country}</div>
              <div className={styles.rateValue}>
                <span className={styles.rateLabel}>1円 =</span>
                <span className={styles.rateNum}>{rate ? rate.toFixed(6) : '-'}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className={styles.empty}>該当する通貨がありません</div>
        )}
      </div>

      <div className={styles.credit}>
        <a href="https://www.exchangerate-api.com/" target="_blank" rel="noopener noreferrer">
          ExchangeRate-API
        </a>{' '}
        を使用しています。
      </div>
      </div>
    </div>
  );
}
