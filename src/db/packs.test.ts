import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { addPack } from './packs';
import type { ProgramPack } from '../lib/packs';

const pack: ProgramPack = {
  id: 'test',
  name: 'Test pack',
  templates: [
    { name: 'Upper', exercises: [{ name: 'Bench Press', sets: 5, reps: '4' }, { name: 'Chin-up', sets: 5, reps: '4' }] },
    { name: 'Lower', exercises: [{ name: 'Core', sets: 3, reps: '10' }] },
  ],
};

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
  await db.exercises.bulkAdd([
    { id: 'bench', name: 'bench press' },
    { id: 'core', name: 'Core', archived: true },
  ]);
});

describe('addPack', () => {
  it('reuses existing exercises by name, unarchives them, and creates missing ones', async () => {
    await addPack(pack);
    const exercises = await db.exercises.toArray();
    expect(exercises).toHaveLength(3);
    expect(exercises.find((e) => e.id === 'core')?.archived).toBe(false);
    expect(exercises.some((e) => e.name === 'Chin-up')).toBe(true);
  });

  it('creates templates with targets keyed by exercise id', async () => {
    const result = await addPack(pack);
    expect(result).toEqual({ added: ['Upper', 'Lower'], skipped: [] });
    const upper = (await db.templates.toArray()).find((t) => t.name === 'Upper')!;
    expect(upper.exerciseIds[0]).toBe('bench');
    expect(upper.targets?.bench).toEqual({ sets: 5, reps: '4' });
  });

  it('skips templates whose name already exists', async () => {
    await addPack(pack);
    expect(await addPack(pack)).toEqual({ added: [], skipped: ['Upper', 'Lower'] });
    expect(await db.templates.count()).toBe(2);
  });
});
