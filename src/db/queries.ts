import { db } from './db';
import type { Backup, Workout, WorkoutEntry } from '../types';
import { BACKUP_VERSION } from '../lib/backup';
import { bestE1rm, sessionVolume, topSet } from '../lib/calc';

export const getActiveWorkout = (): Promise<Workout | undefined> =>
  db.workouts.filter((w) => !w.finishedAt).first();

/** Finished workouts, newest first. */
export const finishedWorkouts = (): Promise<Workout[]> =>
  db.workouts
    .orderBy('startedAt')
    .reverse()
    .filter((w) => !!w.finishedAt)
    .toArray();

export interface LastSession {
  workoutId: string;
  startedAt: string;
  entry: WorkoutEntry;
}

/** Most recent finished session that has at least one done set of this exercise. */
export async function getLastSessionFor(exerciseId: string, excludeWorkoutId?: string): Promise<LastSession | undefined> {
  const workouts = await finishedWorkouts();
  for (const w of workouts) {
    if (w.id === excludeWorkoutId) continue;
    const entry = w.entries.find((e) => e.exerciseId === exerciseId && e.sets.some((s) => s.done));
    if (entry) return { workoutId: w.id, startedAt: w.startedAt, entry };
  }
  return undefined;
}

export interface HistoryPoint {
  workoutId: string;
  startedAt: string;
  top: number;
  e1rm: number;
  volume: number;
  entry: WorkoutEntry;
}

/** One point per finished session, oldest first. */
export async function exerciseHistory(exerciseId: string): Promise<HistoryPoint[]> {
  const workouts = (await finishedWorkouts()).reverse();
  const points: HistoryPoint[] = [];
  for (const w of workouts) {
    const sets = w.entries.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets);
    const top = topSet(sets);
    if (top === null) continue;
    points.push({
      workoutId: w.id,
      startedAt: w.startedAt,
      top,
      e1rm: bestE1rm(sets) ?? 0,
      volume: sessionVolume(sets),
      entry: { exerciseId, sets },
    });
  }
  return points;
}

export async function exportAll(): Promise<Backup> {
  const [exercises, templates, workouts, body] = await Promise.all([
    db.exercises.toArray(),
    db.templates.toArray(),
    db.workouts.toArray(),
    db.body.toArray(),
  ]);
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), exercises, templates, workouts, body };
}

/** Replaces all data with the backup, all-or-nothing. */
export async function importAll(backup: Backup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()));
    await db.exercises.bulkAdd(backup.exercises);
    await db.templates.bulkAdd(backup.templates);
    await db.workouts.bulkAdd(backup.workouts);
    await db.body.bulkAdd(backup.body);
  });
}
