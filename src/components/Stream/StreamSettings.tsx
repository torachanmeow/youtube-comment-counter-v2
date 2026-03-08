import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { DEFAULT_SETTINGS } from '../../utils/constants';
import type { StreamDesign } from '../../types';
import styles from './StreamSettings.module.css';

/** Number input: free typing, commit on blur/Enter with min/max clamping */
function NumInput({ value, onChange, min, max, ...rest }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type' | 'min' | 'max'>) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    let v = parseInt(draft) || 0;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    onChange(v);
    setDraft(null);
  };
  return (
    <input
      type="number"
      value={draft !== null ? draft : String(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
      min={min}
      max={max}
      {...rest}
    />
  );
}

const DEFAULT_DESIGN: StreamDesign = {
  fontSize: DEFAULT_SETTINGS.totalPointsFontSize,
  textColor: DEFAULT_SETTINGS.totalPointsTextColor,
  bgColor: DEFAULT_SETTINGS.totalPointsBgColor,
  fontFamily: '"Noto Sans JP", sans-serif',
  pointsOnly: false,
  label: 'POINT',
  animation: 'none',
  letterSpacing: DEFAULT_SETTINGS.totalPointsLetterSpacing,
  paddingX: DEFAULT_SETTINGS.totalPointsPaddingX,
  paddingY: DEFAULT_SETTINGS.totalPointsPaddingY,
};

function AnimatedPreview({ value, animation, style, className }: { value: number; animation: StreamDesign['animation']; style: React.CSSProperties; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to) { setDisplay(value); return; }

    if (animation === 'bounce' || animation === 'flip') {
      setAnimKey((k) => k + 1);
    }

    if (animation === 'countup') {
      const start = performance.now();
      function tick(now: number) {
        const p = Math.min((now - start) / 1000, 1);
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setDisplay(Math.round(from + (to - from) * eased));
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    } else {
      setDisplay(to);
    }
  }, [value, animation]);

  const animClass = (animation === 'bounce' || animation === 'flip')
    ? styles[`anim_${animation}`]
    : undefined;

  return <span key={animKey} className={`${animClass || ''} ${className || ''}`} style={{ ...style, fontWeight: 700, display: 'inline-block' }}>{display}</span>;
}

const FONT_OPTIONS = [
  { label: 'Noto Sans JP', value: '"Noto Sans JP", sans-serif' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Orbitron', value: '"Orbitron", sans-serif' },
  { label: 'Bebas Neue', value: '"Bebas Neue", sans-serif' },
  { label: 'Teko', value: '"Teko", sans-serif' },
  { label: 'Rajdhani', value: '"Rajdhani", sans-serif' },
  { label: 'Oswald', value: '"Oswald", sans-serif' },
  { label: 'Inter', value: '"Inter", sans-serif' },
  { label: 'システム標準', value: 'system-ui, sans-serif' },
];

const ANIMATION_OPTIONS: { label: string; value: StreamDesign['animation']; desc: string }[] = [
  { label: 'なし', value: 'none', desc: '即時反映' },
  { label: 'カウントアップ', value: 'countup', desc: '数字がスーッと増加' },
  { label: 'バウンス', value: 'bounce', desc: 'ポンと弾む' },
  { label: 'フリップ', value: 'flip', desc: 'パタパタ回転' },
];

export function StreamSettings() {
  const design = useSettingsStore((s) => s.streamDesign);
  const updateStreamDesign = useSettingsStore((s) => s.updateStreamDesign);
  const windowWidth = useSettingsStore((s) => s.streamWindowWidth);
  const windowHeight = useSettingsStore((s) => s.streamWindowHeight);
  const setWindowSize = useSettingsStore((s) => s.setStreamWindowSize);
  const demoTriggerRef = useRef<() => void>(null);

  const handleAnimationSelect = (value: StreamDesign['animation']) => {
    updateStreamDesign({ animation: value });
    // Trigger demo after state update
    setTimeout(() => demoTriggerRef.current?.(), 50);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.infoBox}>
        <div className={styles.infoTitle}>OBS用ウィンドウについて</div>
        OBS用ウィンドウはメインウィンドウのデータをリアルタイム表示します。メインのウィンドウを閉じると、データ取得が停止します（最小化はOK）。
      </div>

      <div className={styles.section}>
        <h3 className={styles.title}>OBS用ウィンドウ設定</h3>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label>テキスト色</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                value={design.textColor}
                onChange={(e) => updateStreamDesign({ textColor: e.target.value })}
                className={styles.colorInput}
              />
              <span className={styles.colorValue}>{design.textColor}</span>
            </div>
          </div>
          <div className={styles.field}>
            <label>背景色</label>
            <div className={styles.colorRow}>
              <input
                type="color"
                value={design.bgColor}
                onChange={(e) => updateStreamDesign({ bgColor: e.target.value })}
                className={styles.colorInput}
              />
              <span className={styles.colorValue}>{design.bgColor}</span>
            </div>
          </div>
        </div>
        <div className={styles.grid4}>
          <div className={styles.field}>
            <label>フォントサイズ (px)</label>
            <NumInput
              value={design.fontSize}
              onChange={(v) => updateStreamDesign({ fontSize: v })}
              min={10}
              max={200}
            />
          </div>
          <div className={styles.field}>
            <label>文字間隔 (px)</label>
            <NumInput
              value={design.letterSpacing}
              onChange={(v) => updateStreamDesign({ letterSpacing: v })}
              min={0}
              max={50}
            />
          </div>
          <div className={styles.field}>
            <label>左右余白 (px)</label>
            <NumInput
              value={design.paddingX}
              onChange={(v) => updateStreamDesign({ paddingX: v })}
              min={0}
              max={200}
            />
          </div>
          <div className={styles.field}>
            <label>上下余白 (px)</label>
            <NumInput
              value={design.paddingY}
              onChange={(v) => updateStreamDesign({ paddingY: v })}
              min={0}
              max={200}
            />
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>表示モード</label>
            <button
              type="button"
              className={`${styles.toggleBtn} ${design.pointsOnly ? styles.toggleBtnActive : ''}`}
              onClick={() => updateStreamDesign({ pointsOnly: !design.pointsOnly })}
            >
              {design.pointsOnly ? '数字のみ' : 'ラベル付き'}
            </button>
          </div>
          <div className={styles.field}>
            <label>ラベルテキスト</label>
            <input
              type="text"
              value={design.label ?? 'POINT'}
              onChange={(e) => updateStreamDesign({ label: e.target.value })}
              placeholder="POINT"
              disabled={design.pointsOnly}
            />
          </div>
        </div>

        {/* Font selector as gallery */}
        <div className={styles.field} style={{ marginBottom: 16 }}>
          <label>フォント</label>
          <div className={styles.fontGallery}>
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.fontCard} ${design.fontFamily === opt.value ? styles.fontCardActive : ''}`}
                onClick={() => updateStreamDesign({ fontFamily: opt.value })}
              >
                <div className={styles.fontCardLabel}>{opt.label}</div>
                <div
                  className={styles.fontCardNumber}
                  style={{ fontFamily: opt.value, color: design.textColor }}
                >
                  12345
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Animation selector as gallery */}
        <div className={styles.field} style={{ marginBottom: 16 }}>
          <label>アニメーション</label>
          <div className={styles.animGallery}>
            {ANIMATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.animCard} ${design.animation === opt.value ? styles.animCardActive : ''}`}
                onClick={() => handleAnimationSelect(opt.value)}
              >
                <div className={styles.animCardLabel}>{opt.label}</div>
                <div className={styles.animCardDesc}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          className={styles.resetBtn}
          onClick={() => updateStreamDesign(DEFAULT_DESIGN)}
        >
          初期値に戻す
        </button>
      </div>

      {/* Window Size */}
      <div className={styles.section}>
        <h3 className={styles.title}>ウィンドウサイズ</h3>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label>幅 (px)</label>
            <NumInput
              value={windowWidth}
              onChange={(v) => setWindowSize(v, windowHeight)}
              min={100}
              max={1920}
            />
          </div>
          <div className={styles.field}>
            <label>高さ (px)</label>
            <NumInput
              value={windowHeight}
              onChange={(v) => setWindowSize(windowWidth, v)}
              min={50}
              max={1080}
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <PreviewSection design={design} demoTriggerRef={demoTriggerRef} />
    </div>
  );
}

function PreviewSection({ design, demoTriggerRef }: { design: StreamDesign; demoTriggerRef: React.RefObject<(() => void) | null> }) {
  const DEMO_VALUES = [100, 5678, 12345, 99999];
  const [demoIndex, setDemoIndex] = useState(0);
  const demoValue = DEMO_VALUES[demoIndex];
  const windowWidth = useSettingsStore((s) => s.streamWindowWidth);
  const windowHeight = useSettingsStore((s) => s.streamWindowHeight);

  const runDemo = useCallback(() => {
    setDemoIndex((i) => (i + 1) % DEMO_VALUES.length);
  }, []);

  useEffect(() => {
    (demoTriggerRef as React.MutableRefObject<(() => void) | null>).current = runDemo;
  }, [runDemo, demoTriggerRef]);

  // Scale preview to fit within max width, keeping aspect ratio
  const maxPreviewWidth = 360;
  const scale = Math.min(1, maxPreviewWidth / windowWidth);
  const previewW = windowWidth * scale;
  const previewH = windowHeight * scale;
  return (
    <div className={styles.section}>
      <h3 className={styles.title}>プレビュー</h3>
      <div className={styles.previewFrame}>
        <div className={styles.previewChrome} style={{ width: previewW }}>
          <div className={styles.previewTitleBar}>
            <div className={styles.previewDots}><span /><span /><span /></div>
            OBS用ウィンドウ
          </div>
          <div
            className={styles.preview}
            style={{
              width: previewW,
              height: previewH,
              background: design.bgColor,
              color: design.textColor,
              fontSize: `${Math.max(12, design.fontSize * scale)}px`,
              letterSpacing: `${design.letterSpacing * scale}px`,
              paddingLeft: `${design.paddingX * scale}px`,
              paddingRight: `${design.paddingX * scale}px`,
              paddingTop: `${design.paddingY * scale}px`,
              paddingBottom: `${design.paddingY * scale}px`,
              fontFamily: design.fontFamily,
            }}
          >
            {!design.pointsOnly && (design.label ?? 'POINT') && <span className={styles.previewLabel} style={{ left: `${design.paddingX * scale}px`, top: `${(design.paddingY + 6) * scale}px` }}>{design.label ?? 'POINT'}</span>}
            <AnimatedPreview value={demoValue} animation={design.animation} style={{}} className={design.pointsOnly ? styles.previewValueCenter : undefined} />
          </div>
        </div>
        <div className={styles.previewSize}>{windowWidth} × {windowHeight}px</div>
      </div>
    </div>
  );
}
