import { describe, expect, it } from 'vitest';
import { rollingAverage } from './rolling';

describe('rollingAverage', () => {
  it('averages values in the 7 calendar days ending on each date', () => {
    const out = rollingAverage([
      { date: '2026-10-10', value: 82 },
      { date: '2026-10-01', value: 80 },
      { date: '2026-10-07', value: 81 },
    ]);
    expect(out.map((p) => p.date)).toEqual(['2026-10-01', '2026-10-07', '2026-10-10']);
    expect(out[0].avg).toBe(80);
    expect(out[1].avg).toBe(80.5); // 10-01..10-07 includes both
    expect(out[2].avg).toBe(81.5); // 10-04..10-10 excludes 10-01
  });
  it('handles empty input', () => expect(rollingAverage([])).toEqual([]));
});
