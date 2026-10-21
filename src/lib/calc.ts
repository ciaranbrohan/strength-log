import type { SetEntry, WorkoutEntry } from '../types';

/** Epley estimated one-rep max. */
export function e1rm(weightKg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

const doneSets = (sets: SetEntry[]) => sets.filter((s) => s.done);

const maxOrNull = (values: number[]): number | null => (values.length ? Math.max(...values) : null);

export const topSet = (sets: SetEntry[]): number | null => maxOrNull(doneSets(sets).map((s) => s.weightKg));

export const bestE1rm = (sets: SetEntry[]): number | null =>
  maxOrNull(doneSets(sets).map((s) => e1rm(s.weightKg, s.reps)));

export const sessionVolume = (sets: SetEntry[]): number =>
  doneSets(sets).reduce((sum, s) => sum + s.weightKg * s.reps, 0);

export const workoutVolume = (entries: WorkoutEntry[]): number =>
  entries.reduce((sum, e) => sum + sessionVolume(e.sets), 0);
