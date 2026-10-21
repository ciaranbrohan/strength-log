import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, seedIfEmpty, STARTER_EXERCISES } from './db';
import { exerciseHistory, exportAll, getActiveWorkout, getLastSessionFor, importAll } from './queries';
import type { Workout } from '../types';

const workout = (id: string, day: string, sets: [number, number, boolean][], finished = true): Workout => ({
  id,
  startedAt: `2026-10-${day}T18:00:00.000Z`,
  finishedAt: finished ? `2026-10-${day}T19:00:00.000Z` : undefined,
  entries: [{ exerciseId: 'bench', sets: sets.map(([weightKg, reps, done]) => ({ weightKg, reps, done })) }],
});

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('seedIfEmpty', () => {
  it('seeds starter exercises once', async () => {
    await seedIfEmpty();
    await seedIfEmpty();
    expect(await db.exercises.count()).toBe(STARTER_EXERCISES.length);
  });
});

describe('getActiveWorkout', () => {
  it('returns the unfinished workout', async () => {
    await db.workouts.bulkAdd([workout('a', '01', []), workout('b', '02', [], false)]);
    expect((await getActiveWorkout())?.id).toBe('b');
  });
  it('returns undefined when none is active', async () => {
    await db.workouts.add(workout('a', '01', []));
    expect(await getActiveWorkout()).toBeUndefined();
  });
});

describe('getLastSessionFor', () => {
  it('finds the newest finished session with done sets', async () => {
    await db.workouts.bulkAdd([
      workout('old', '01', [[90, 5, true]]),
      workout('mid', '05', [[100, 5, true]]),
      workout('skipped', '07', [[110, 5, false]]),
      workout('active', '09', [[120, 5, true]], false),
    ]);
    const last = await getLastSessionFor('bench');
    expect(last?.workoutId).toBe('mid');
    expect(last?.entry.sets[0].weightKg).toBe(100);
  });
  it('can exclude a workout', async () => {
    await db.workouts.bulkAdd([workout('a', '01', [[90, 5, true]]), workout('b', '05', [[100, 5, true]])]);
    expect((await getLastSessionFor('bench', 'b'))?.workoutId).toBe('a');
  });
  it('returns undefined for an unused exercise', async () => {
    expect(await getLastSessionFor('squat')).toBeUndefined();
  });
});

describe('exerciseHistory', () => {
  it('returns one ascending point per finished session', async () => {
    await db.workouts.bulkAdd([
      workout('b', '05', [[100, 5, true], [105, 3, true]]),
      workout('a', '01', [[90, 5, true]]),
      workout('c', '09', [[200, 1, true]], false),
    ]);
    const h = await exerciseHistory('bench');
    expect(h.map((p) => p.workoutId)).toEqual(['a', 'b']);
    expect(h[1]).toMatchObject({ top: 105, volume: 815 });
    expect(h[1].e1rm).toBeCloseTo(116.667, 2);
  });
});

describe('export / import', () => {
  it('round-trips all data', async () => {
    await seedIfEmpty();
    await db.workouts.add(workout('a', '01', [[90, 5, true]]));
    await db.body.add({ date: '2026-10-01', weightKg: 82 });
    const backup = await exportAll();
    await db.workouts.clear();
    await db.body.put({ date: '2026-10-02', weightKg: 99 });
    await importAll(backup);
    expect(await db.workouts.count()).toBe(1);
    expect(await db.body.toArray()).toEqual([{ date: '2026-10-01', weightKg: 82 }]);
    expect(await db.exercises.count()).toBe(STARTER_EXERCISES.length);
  });
});
