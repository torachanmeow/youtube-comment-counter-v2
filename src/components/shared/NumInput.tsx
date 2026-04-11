/** blur/Enter確定のnumber input。入力中はローカル値で自由に編集でき、確定時にmin/maxクランプする */
import { useState } from 'react';

interface Props {
  value: number;
  onCommit: (v: number) => void;
  fallback?: number;
  min?: number;
  max?: number;
  className?: string;
}

export function NumInput({
  value, onCommit, fallback = 0, min, max, className, ...rest
}: Props & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur' | 'type' | 'min' | 'max'>) {
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    let v = parseFloat(draft);
    if (isNaN(v)) v = fallback;
    if (min != null) v = Math.max(min, v);
    if (max != null) v = Math.min(max, v);
    onCommit(v);
    setDraft(null);
  };

  return (
    <input
      type="number"
      className={className}
      value={draft !== null ? draft : String(value)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
      onFocus={(e) => e.target.select()}
      min={min}
      max={max}
      {...rest}
    />
  );
}
