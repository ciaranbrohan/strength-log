import { useEffect, useState } from 'react';

interface Props {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  className?: string;
  integer?: boolean;
  placeholder?: string;
  ariaLabel?: string;
}

/** Number input that keeps the raw text while typing (so "102." isn't clobbered). */
export default function NumField({ value, onChange, className = 'set-input', integer, placeholder, ariaLabel }: Props) {
  const [text, setText] = useState(value === undefined ? '' : String(value));

  useEffect(() => {
    const parsed = text.trim() === '' ? undefined : Number(text.replace(',', '.'));
    if (parsed !== value) setText(value === undefined ? '' : String(value));
    // only react to outside changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      className={className}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      enterKeyHint="next"
      placeholder={placeholder}
      aria-label={ariaLabel}
      value={text}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw.trim() === '') return onChange(undefined);
        const n = Number(raw.replace(',', '.'));
        if (Number.isFinite(n) && n >= 0) onChange(integer ? Math.round(n) : n);
      }}
    />
  );
}
