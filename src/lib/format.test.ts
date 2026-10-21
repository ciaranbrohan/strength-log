import { describe, expect, it } from 'vitest';
import { formatKg, formatSets } from './format';

const s = (weightKg: number, reps: number, done = true) => ({ weightKg, reps, done });

describe('formatSets', () => {
  it('collapses identical sets', () => expect(formatSets([s(100, 5), s(100, 5), s(100, 5)])).toBe('3×5 @ 100kg'));
  it('lists differing sets', () => expect(formatSets([s(100, 5), s(102.5, 3)])).toBe('100×5, 102.5×3'));
  it('skips sets not done', () => expect(formatSets([s(100, 5), s(200, 1, false)])).toBe('1×5 @ 100kg'));
  it('returns empty for nothing done', () => expect(formatSets([])).toBe(''));
});

describe('formatKg', () => {
  it('trims trailing zeros', () => {
    expect(formatKg(100)).toBe('100');
    expect(formatKg(102.5)).toBe('102.5');
    expect(formatKg(80.25)).toBe('80.25');
  });
});
