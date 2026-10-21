import { db } from './db';
import { getLastSessionFor } from './queries';
import { newId } from '../lib/id';
import { targetRepsNumber } from '../lib/target';
import type { SetEntry, Template, TemplateTarget, WorkoutEntry } from '../types';

const blankSet = (): SetEntry => ({ weightKg: 0, reps: 0, done: false });
const undone = (s: SetEntry): SetEntry => ({ weightKg: s.weightKg, reps: s.reps, done: false });

/**
 * A new entry pre-filled with last session's completed sets (not yet done).
 * With no history, falls back to the template target, then to one blank set.
 */
export async function prefilledEntry(
  exerciseId: string,
  excludeWorkoutId?: string,
  target?: TemplateTarget,
): Promise<WorkoutEntry> {
  const last = await getLastSessionFor(exerciseId, excludeWorkoutId);
  const sets = last?.entry.sets.filter((s) => s.done).map(undone) ?? [];
  if (sets.length) return { exerciseId, sets };
  if (target && target.sets > 0) {
    const reps = targetRepsNumber(target.reps);
    return { exerciseId, sets: Array.from({ length: target.sets }, () => ({ weightKg: 0, reps, done: false })) };
  }
  return { exerciseId, sets: [blankSet()] };
}

/** The set to add next: same position from last time, else a copy of the previous set. */
export function nextSet(current: SetEntry[], lastSets: SetEntry[] | undefined): SetEntry {
  const fromLast = lastSets?.filter((s) => s.done)[current.length];
  if (fromLast) return undone(fromLast);
  const prev = current[current.length - 1];
  return prev ? undone(prev) : blankSet();
}

export async function startWorkout(template?: Template): Promise<string> {
  const id = newId();
  const entries = await Promise.all((template?.exerciseIds ?? []).map((exId) => prefilledEntry(exId, undefined, template?.targets?.[exId])));
  await db.workouts.add({ id, startedAt: new Date().toISOString(), templateId: template?.id, entries });
  return id;
}
