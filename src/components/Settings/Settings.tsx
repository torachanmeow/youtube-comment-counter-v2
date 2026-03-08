import { useState, type FocusEvent } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import styles from './Settings.module.css';

const selectAll = (e: FocusEvent<HTMLInputElement>) => e.target.select();

/** blur確定のnumber input。入力中はローカル値で自由に編集できる */
function NumInput({
  value, onCommit, fallback = 0, className, ...rest
}: {
  value: number;
  onCommit: (v: number) => void;
  fallback?: number;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur' | 'type'>) {
  const [local, setLocal] = useState<string | null>(null);
  return (
    <input
      type="number"
      className={className}
      value={local !== null ? local : String(value)}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        const parsed = parseFloat(local || '');
        onCommit(isNaN(parsed) ? fallback : parsed);
        setLocal(null);
      }}
      onFocus={selectAll}
      {...rest}
    />
  );
}

interface Props {
  isLocked: boolean;
}

export function Settings({ isLocked }: Props) {
  const apiKey = useSettingsStore((s) => s.apiKey);
  const videoId = useSettingsStore((s) => s.videoId);
  const pollingInterval = useSettingsStore((s) => s.pollingInterval);
  const weights = useSettingsStore((s) => s.weights);
  const keywords = useSettingsStore((s) => s.keywords);
  const allowKeywordDuplicates = useSettingsStore((s) => s.allowKeywordDuplicates);
  const keywordDuplicateLimit = useSettingsStore((s) => s.keywordDuplicateLimit);

  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setVideoId = useSettingsStore((s) => s.setVideoId);
  const setPollingInterval = useSettingsStore((s) => s.setPollingInterval);
  const updateWeight = useSettingsStore((s) => s.updateWeight);
  const updateKeywordWeight = useSettingsStore((s) => s.updateKeywordWeight);
  const updateCountRule = useSettingsStore((s) => s.updateCountRule);
  const resetToDefaults = useSettingsStore((s) => s.resetToDefaults);

  return (
    <div className={styles.settings}>
      {/* Quick Start Guide */}
      <div className={styles.quickStart}>
        <div className={styles.quickStartTitle}>はじめかた</div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <span className={styles.stepText}>APIキーと動画IDを設定</span>
          </div>
          <span className={styles.stepArrow}>→</span>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span className={styles.stepText}>「開始」でデータ取得</span>
          </div>
          <span className={styles.stepArrow}>→</span>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span className={styles.stepText}>OBS用ウィンドウを設定</span>
          </div>
        </div>
      </div>

      {/* API Settings */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>API設定</h3>
        <div className={styles.field}>
          <label>YouTube API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            disabled={isLocked}
          />
        </div>
        <div className={styles.field}>
          <label>動画ID / URL</label>
          <input
            type="text"
            value={videoId}
            onChange={(e) => {
              const v = e.target.value.trim();
              const match = v.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
              setVideoId(match ? match[1] : v.replace(/[^a-zA-Z0-9_-]/g, ''));
            }}
            placeholder="動画IDまたはURL"
            disabled={isLocked}
          />
        </div>
        <div className={styles.field}>
          <label>ポーリング間隔（秒）</label>
          <NumInput
            value={pollingInterval}
            onCommit={setPollingInterval}
            fallback={30}
            min={10}
            max={300}
          />
        </div>
      </section>

      {/* Weight Settings */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>ポイント倍率</h3>
        <div className={styles.weightGrid}>
          {[
            { key: 'likes', label: '高評価' },
            { key: 'superChats', label: 'スーパーチャット' },
            { key: 'superStickers', label: 'スーパーステッカー' },
            { key: 'members', label: 'メンバーシップ' },
          ].map(({ key, label }) => (
            <div key={key} className={styles.weightItem}>
              <label>{label}</label>
              <NumInput
                value={weights[key as keyof typeof weights] as number}
                onCommit={(v) => updateWeight(key, v)}
                min={-99999}
                max={99999}
                step={key === 'members' ? '1' : '0.1'}
                disabled={isLocked}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Keyword Settings */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>キーワード設定</h3>
        <div className={styles.keywordList}>
          {keywords.map((kw, i) => (
            <div key={i} className={styles.keywordRow}>
              <input
                type="text"
                value={kw.word}
                onChange={(e) => {
                  const newKw = [...keywords];
                  newKw[i] = { ...newKw[i], word: e.target.value };
                  useSettingsStore.setState({ keywords: newKw });
                  if (e.target.value) {
                    updateKeywordWeight(e.target.value, kw.weight);
                  }
                }}
                placeholder={`キーワード ${i + 1}`}
                className={styles.keywordInput}
                disabled={isLocked}
              />
              <NumInput
                value={kw.weight}
                onCommit={(val) => {
                  const newKw = [...keywords];
                  newKw[i] = { ...newKw[i], weight: val };
                  useSettingsStore.setState({ keywords: newKw });
                  if (kw.word) updateKeywordWeight(kw.word, val);
                }}
                min={-99999}
                max={99999}
                step="1"
                className={styles.keywordWeight}
                placeholder="倍率"
                disabled={isLocked}
              />
            </div>
          ))}
        </div>

        <div className={styles.countRule}>
          <div className={styles.countRuleGrid}>
            <div className={styles.field}>
              <label>重複カウント</label>
              <button
                type="button"
                className={`${styles.toggleBtn} ${allowKeywordDuplicates ? styles.toggleBtnActive : ''}`}
                onClick={() => updateCountRule(!allowKeywordDuplicates, keywordDuplicateLimit)}
              >
                {allowKeywordDuplicates ? '許可する' : '許可しない'}
              </button>
            </div>
            {allowKeywordDuplicates && (
              <div className={styles.field}>
                <label>重複上限</label>
                <NumInput
                  value={keywordDuplicateLimit}
                  onCommit={(v) => updateCountRule(allowKeywordDuplicates, v)}
                  fallback={1}
                  min={1}
                  max={99999}
                />
              </div>
            )}
          </div>
        </div>
      </section>

      <button className={styles.resetBtn} onClick={resetToDefaults} disabled={isLocked}>
        設定をリセット
      </button>
    </div>
  );
}
