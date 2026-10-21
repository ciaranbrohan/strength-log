import type { SetEntry } from '../types';

export const formatKg = (kg: number): string => String(Math.round(kg * 100) / 100);

/** "3×5 @ 100kg" when every done set matches, otherwise "100×5, 105×3". */
export function formatSets(sets: SetEntry[]): string {
  const done = sets.filter((s) => s.done);
  if (!done.length) return '';
  const first = done[0];
  if (done.every((s) => s.weightKg === first.weightKg && s.reps === first.reps)) {
    return `${done.length}×${first.reps} @ ${formatKg(first.weightKg)}kg`;
  }
  return done.map((s) => `${formatKg(s.weightKg)}×${s.reps}`).join(', ');
}

/** Local calendar date as YYYY-MM-DD. */
export function isoDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayIso = (): string => isoDate();

export function formatDate(value: string): string {
  const d = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

export const shortDate = (value: string): string => {
  const d = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
};
