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
      {/* API Settings */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>API設定</h3>
        <p className={styles.sectionDesc}>YouTube Data API v3のキーとライブ配信の動画IDが必要です。APIキーはGoogle Cloud Consoleから取得できます。</p>
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
        <div className={styles.gridApi}>
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
            <label>ポーリング間隔</label>
            <div className={styles.fieldInlineInput}>
              <NumInput
                value={pollingInterval}
                onCommit={setPollingInterval}
                fallback={30}
                min={10}
                max={300}
              />
              <span className={styles.unit}>秒</span>
            </div>
          </div>
        </div>
      </section>

      {/* Point Settings */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>ポイント設定</h3>

        <h4 className={styles.subTitle}>基本倍率</h4>
        <p className={styles.subTitleDesc}>各項目の件数 × 倍率 = ポイント。スーパーチャット・ステッカーは円換算合計額に倍率を掛けます。</p>
        <div className={styles.weightList}>
          {[
            { key: 'likes', label: '高評価', icon: '👍' },
            { key: 'superChats', label: 'スーパーチャット', icon: '💰' },
            { key: 'superStickers', label: 'スーパーステッカー', icon: '🎨' },
            { key: 'members', label: 'メンバーシップ', icon: '👑' },
          ].map(({ key, label, icon }) => (
            <div key={key} className={styles.weightRow}>
              <span className={styles.weightIcon}>{icon}</span>
              <span className={styles.weightLabel}>{label}</span>
              <NumInput
                value={weights[key as keyof typeof weights] as number}
                onCommit={(v) => updateWeight(key, v)}
                min={-99999}
                max={99999}
                step={key === 'members' ? '1' : '0.1'}
                disabled={isLocked}
                className={styles.weightInput}
              />
            </div>
          ))}
        </div>

        <h4 className={styles.subTitle}>重複キーワードカウント</h4>
        <p className={styles.subTitleDesc}>同一ユーザーが同じキーワードを複数回発言した場合にカウントするかどうかの設定です</p>
        <div className={styles.countRule}>
          <div className={styles.countRuleHeader}>
            <div className={styles.countRuleRow}>
              <div className={styles.toggleGroup}>
                <button
                  type="button"
                  className={`${styles.toggleGroupBtn} ${!allowKeywordDuplicates ? styles.toggleGroupBtnActive : ''}`}
                  onClick={() => updateCountRule(false, keywordDuplicateLimit)}
                >
                  許可しない
                </button>
                <button
                  type="button"
                  className={`${styles.toggleGroupBtn} ${allowKeywordDuplicates ? styles.toggleGroupBtnActive : ''}`}
                  onClick={() => updateCountRule(true, keywordDuplicateLimit)}
                >
                  許可する
                </button>
              </div>
              {allowKeywordDuplicates && (
                <>
                  <label>上限</label>
                  <NumInput
                    value={keywordDuplicateLimit}
                    onCommit={(v) => updateCountRule(allowKeywordDuplicates, v)}
                    fallback={1}
                    min={1}
                    max={99999}
                    className={styles.countLimitInput}
                  />
                  <span className={styles.unit}>回</span>
                </>
              )}
            </div>
            <p className={styles.countRuleDesc}>
              {allowKeywordDuplicates
                ? `同一ユーザーのキーワードを最大${keywordDuplicateLimit}回までカウントします`
                : '同一ユーザーのキーワードは1回のみカウントします'}
            </p>
          </div>
        </div>
        <h4 className={styles.subTitle}>キーワード</h4>
        <p className={styles.subTitleDesc}>チャットにキーワードが含まれると、右の倍率分のポイントが加算されます</p>
        <div className={styles.weightList}>
          {keywords.map((kw, i) => (
            <div key={i} className={styles.weightRow}>
              <span className={styles.weightIcon}>{i + 1}</span>
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
                className={styles.weightInput}
                placeholder="0"
                disabled={isLocked}
              />
            </div>
          ))}
        </div>
      </section>

      <button className={styles.resetBtn} onClick={resetToDefaults} disabled={isLocked}>
        設定をリセット
      </button>
    </div>
  );
}
