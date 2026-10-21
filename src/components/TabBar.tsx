export type Tab = 'train' | 'history' | 'exercises' | 'body' | 'settings';

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const ICONS: Record<Tab, React.ReactNode> = {
  train: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  exercises: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M3 20l6-7 4 4 8-10" />
      <path d="M15 7h6v6" />
    </svg>
  ),
  body: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 9a5 5 0 0 1 8 0M12 12l2-3" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" {...stroke}>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </svg>
  ),
};

const LABELS: Record<Tab, string> = {
  train: 'Train',
  history: 'History',
  exercises: 'Exercises',
  body: 'Body',
  settings: 'Settings',
};

export default function TabBar({ tab, onSelect }: { tab: Tab; onSelect: (t: Tab) => void }) {
  return (
    <nav className="tabbar">
      {(Object.keys(LABELS) as Tab[]).map((t) => (
        <button key={t} aria-current={t === tab ? 'page' : undefined} onClick={() => onSelect(t)}>
          {ICONS[t]}
          {LABELS[t]}
        </button>
      ))}
    </nav>
  );
}
