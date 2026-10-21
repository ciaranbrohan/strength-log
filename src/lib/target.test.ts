import { describe, expect, it } from 'vitest';
import { formatTarget, targetRepsNumber } from './target';

describe('targetRepsNumber', () => {
  it('uses the lower end of a range', () => expect(targetRepsNumber('9-12')).toBe(9));
  it('handles plain numbers', () => expect(targetRepsNumber('4')).toBe(4));
  it('handles per-side reps', () => expect(targetRepsNumber('11/11')).toBe(11));
  it('returns 0 when there is no number', () => expect(targetRepsNumber('AMRAP')).toBe(0));
});

describe('formatTarget', () => {
  it('joins sets and reps', () => expect(formatTarget({ sets: 4, reps: '9-12' })).toBe('4×9-12'));
});
