import Dexie, { type EntityTable } from 'dexie';
import type { BodyEntry, Exercise, Template, Workout } from '../types';
import { newId } from '../lib/id';

export const db = new Dexie('strength-log') as Dexie & {
  exercises: EntityTable<Exercise, 'id'>;
  templates: EntityTable<Template, 'id'>;
  workouts: EntityTable<Workout, 'id'>;
  body: EntityTable<BodyEntry, 'date'>;
};

db.version(1).stores({
  exercises: 'id, name',
  templates: 'id',
  workouts: 'id, startedAt',
  body: 'date',
});

export const STARTER_EXERCISES = [
  'Back Squat',
  'Front Squat',
  'Bench Press',
  'Incline Bench Press',
  'Deadlift',
  'Romanian Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Pull-up',
  'Dip',
];

export async function seedIfEmpty(): Promise<void> {
  await db.transaction('rw', db.exercises, async () => {
    if ((await db.exercises.count()) > 0) return;
    await db.exercises.bulkAdd(STARTER_EXERCISES.map((name) => ({ id: newId(), name })));
  });
}
