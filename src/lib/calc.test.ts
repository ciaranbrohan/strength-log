import { describe, expect, it } from 'vitest';
import { bestE1rm, e1rm, sessionVolume, topSet, workoutVolume } from './calc';
import type { SetEntry } from '../types';

const s = (weightKg: number, reps: number, done = true): SetEntry => ({ weightKg, reps, done });

describe('e1rm', () => {
  it('uses Epley', () => expect(e1rm(100, 5)).toBeCloseTo(116.667, 2));
  it('returns the weight for a single', () => expect(e1rm(140, 1)).toBe(140));
  it('returns 0 for zero reps', () => expect(e1rm(100, 0)).toBe(0));
});

describe('set aggregates', () => {
  const sets = [s(100, 5), s(110, 3), s(120, 1, false)];
  it('topSet ignores sets not done', () => expect(topSet(sets)).toBe(110));
  it('bestE1rm takes the max', () => expect(bestE1rm(sets)).toBeCloseTo(121, 5));
  it('sessionVolume sums done sets', () => expect(sessionVolume(sets)).toBe(830));
  it('returns null with no done sets', () => {
    expect(topSet([s(100, 5, false)])).toBeNull();
    expect(bestE1rm([])).toBeNull();
  });
  it('workoutVolume sums every entry', () =>
    expect(workoutVolume([{ exerciseId: 'a', sets }, { exerciseId: 'b', sets: [s(50, 10)] }])).toBe(1330));
});
