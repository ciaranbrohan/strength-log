import type { Backup, Exercise, Workout } from '../types';
import { formatKg, isoDate } from './format';

export const BACKUP_VERSION = 1;

type Result = { ok: true; data: Backup } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const optional = <T>(v: unknown, check: (v: unknown) => v is T) => v === undefined || check(v);

const validExercise = (e: unknown) => isObj(e) && isStr(e.id) && isStr(e.name) && optional(e.archived, (v): v is boolean => typeof v === 'boolean');

const validTemplate = (t: unknown) =>
  isObj(t) && isStr(t.id) && isStr(t.name) && Array.isArray(t.exerciseIds) && t.exerciseIds.every(isStr);

const validSet = (s: unknown) => isObj(s) && isNum(s.weightKg) && isNum(s.reps) && typeof s.done === 'boolean';

const validWorkout = (w: unknown) =>
  isObj(w) &&
  isStr(w.id) &&
  isStr(w.startedAt) &&
  optional(w.finishedAt, isStr) &&
  optional(w.templateId, isStr) &&
  optional(w.notes, isStr) &&
  Array.isArray(w.entries) &&
  w.entries.every((e) => isObj(e) && isStr(e.exerciseId) && Array.isArray(e.sets) && e.sets.every(validSet));

const validBody = (b: unknown) =>
  isObj(b) && isStr(b.date) && /^\d{4}-\d{2}-\d{2}$/.test(b.date) && optional(b.weightKg, isNum) && optional(b.bodyFatPct, isNum);

export function validateBackup(json: unknown): Result {
  if (!isObj(json)) return { ok: false, error: 'File is not a Strength Log backup.' };
  if (json.version !== BACKUP_VERSION) return { ok: false, error: `Unsupported backup version (${String(json.version)}).` };
  const tables: [string, (v: unknown) => boolean, string][] = [
    ['exercises', validExercise, 'exercise'],
    ['templates', validTemplate, 'template'],
    ['workouts', validWorkout, 'workout'],
    ['body', validBody, 'body entry'],
  ];
  for (const [key, check, label] of tables) {
    const rows = json[key];
    if (!Array.isArray(rows)) return { ok: false, error: `Backup is missing "${key}".` };
    const bad = rows.findIndex((r) => !check(r));
    if (bad !== -1) return { ok: false, error: `Invalid ${label} at position ${bad + 1}.` };
  }
  return { ok: true, data: json as unknown as Backup };
}

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function toCsv(workouts: Workout[], exercises: Exercise[]): string {
  const names = new Map(exercises.map((e) => [e.id, e.name]));
  const rows = ['date,workout_id,exercise,set_number,weight_kg,reps'];
  const finished = workouts.filter((w) => w.finishedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  for (const w of finished) {
    const date = isoDate(new Date(w.startedAt));
    for (const entry of w.entries) {
      const name = csvCell(names.get(entry.exerciseId) ?? 'Unknown');
      entry.sets
        .filter((s) => s.done)
        .forEach((s, i) => rows.push([date, w.id, name, i + 1, formatKg(s.weightKg), s.reps].join(',')));
    }
  }
  return rows.join('\n');
}
