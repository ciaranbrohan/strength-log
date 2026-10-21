import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { nextSet, prefilledEntry, startWorkout } from './actions';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  await db.workouts.add({
    id: 'prev',
    startedAt: '2026-10-01T18:00:00.000Z',
    finishedAt: '2026-10-01T19:00:00.000Z',
    entries: [
      {
        exerciseId: 'bench',
        sets: [
          { weightKg: 100, reps: 5, done: true },
          { weightKg: 105, reps: 3, done: true },
          { weightKg: 110, reps: 1, done: false },
        ],
      },
    ],
  });
});

describe('prefilledEntry', () => {
  it('copies last done sets as not done', async () => {
    const e = await prefilledEntry('bench');
    expect(e.sets).toEqual([
      { weightKg: 100, reps: 5, done: false },
      { weightKg: 105, reps: 3, done: false },
    ]);
  });
  it('starts with one blank set for a new exercise', async () => {
    expect((await prefilledEntry('squat')).sets).toEqual([{ weightKg: 0, reps: 0, done: false }]);
  });
});

describe('nextSet', () => {
  const last = [
    { weightKg: 100, reps: 5, done: true },
    { weightKg: 105, reps: 3, done: true },
  ];
  it('uses the matching set from last time', () =>
    expect(nextSet([{ weightKg: 100, reps: 5, done: true }], last)).toEqual({ weightKg: 105, reps: 3, done: false }));
  it('falls back to the previous set this session', () =>
    expect(nextSet([{ weightKg: 1, reps: 1, done: true }, { weightKg: 2, reps: 2, done: true }, { weightKg: 90, reps: 8, done: true }], last)).toEqual({ weightKg: 90, reps: 8, done: false }));
  it('starts blank with nothing to copy', () => expect(nextSet([], undefined)).toEqual({ weightKg: 0, reps: 0, done: false }));
});

describe('startWorkout', () => {
  it('creates an active workout from a template with prefilled sets', async () => {
    const id = await startWorkout({ id: 't', name: 'Push', exerciseIds: ['bench', 'ohp'] });
    const w = await db.workouts.get(id);
    expect(w?.finishedAt).toBeUndefined();
    expect(w?.templateId).toBe('t');
    expect(w?.entries.map((e) => [e.exerciseId, e.sets.length])).toEqual([
      ['bench', 2],
      ['ohp', 1],
    ]);
  });
  it('creates an empty workout without a template', async () => {
    const w = await db.workouts.get(await startWorkout());
    expect(w?.entries).toEqual([]);
  });
});

describe('targets', () => {
  it('prefills target sets for a first-time exercise', async () => {
    const e = await prefilledEntry('squat', undefined, { sets: 3, reps: '9-12' });
    expect(e.sets).toEqual([0, 1, 2].map(() => ({ weightKg: 0, reps: 9, done: false })));
  });
  it('still prefers last session over the target', async () => {
    const e = await prefilledEntry('bench', undefined, { sets: 5, reps: '4' });
    expect(e.sets).toHaveLength(2);
  });
  it('startWorkout passes template targets through', async () => {
    const id = await startWorkout({ id: 't', name: 'L', exerciseIds: ['squat'], targets: { squat: { sets: 5, reps: '4' } } });
    expect((await db.workouts.get(id))?.entries[0].sets).toHaveLength(5);
  });
});
