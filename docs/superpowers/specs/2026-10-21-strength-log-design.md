# Strength Log — Design

**Date:** 2026-10-21
**Status:** Approved design, pending spec review

## Purpose

A lightweight, personal strength-training journal used on a phone at the gym. Logs workouts, surfaces progressive overload (what I did last time, progress over time), and tracks bodyweight and body fat %. Single user, no accounts.

## Decisions

| Topic | Decision |
|---|---|
| Platform | Mobile-first installable web app (PWA), works offline |
| Stack | Vite + React + TypeScript, Dexie (IndexedDB), vite-plugin-pwa, Recharts |
| Storage | On-device only (IndexedDB). JSON backup/restore + CSV export. No backend, no login |
| Units | kg only |
| Workout structure | Templates (saved routines) + freeform sessions |
| Overload features | "Last time" reference while logging; per-exercise progress charts |
| Body stats | Bodyweight (with 7-day average trend), body fat % |
| Hosting | Any static HTTPS host (GitHub Pages / Netlify / Vercel) — needed for PWA install |

**Out of scope (v1):** PR flags, next-session suggestions, body measurements, progress photos, multi-device sync, structured programs (5/3/1 etc.), lb support, rest timer.

## Data model

All weights stored in kg. Dates stored as ISO strings (`YYYY-MM-DD` for body entries, full ISO timestamp for workouts).

```ts
Exercise   { id: string; name: string; archived?: boolean }
Template   { id: string; name: string; exerciseIds: string[] }
Workout    { id: string; startedAt: string; finishedAt?: string;
             templateId?: string; notes?: string;
             entries: WorkoutEntry[] }
WorkoutEntry { exerciseId: string; sets: SetEntry[] }
SetEntry   { weightKg: number; reps: number; done: boolean }
BodyEntry  { date: string /* YYYY-MM-DD, primary key */; weightKg?: number; bodyFatPct?: number }
```

- A workout with no `finishedAt` is the **active workout**. At most one exists at a time.
- Only sets with `done: true` count toward history, "last time", and charts.
- Exercises are archived, never hard-deleted, so history stays intact.
- First launch seeds a starter exercise list: Back Squat, Front Squat, Bench Press, Incline Bench Press, Deadlift, Romanian Deadlift, Overhead Press, Barbell Row, Pull-up, Dip.

## Screens

Bottom tab bar: **Train · History · Exercises · Body · Settings**.

### Train
- No active workout: buttons to start from each template, or "Empty workout".
- Active workout: list of exercises; each shows a **Last time** line (e.g. `3×5 @ 100kg`, or set-by-set if they differ) from the most recent finished workout containing that exercise.
- New sets pre-fill from the corresponding set last time (falling back to the previous set in this session). Each set row: weight, reps, done checkbox. Add/remove sets, add/remove/reorder exercises, notes.
- Every edit persists immediately to IndexedDB; reopening the app resumes the active workout.
- "Finish" sets `finishedAt`. "Discard" deletes the active workout after confirmation.

### History
- Reverse-chronological list of finished workouts: date, template name (if any), exercise count, total volume.
- Tap to open; editable in place (same editor as Train). Delete with confirmation.

### Exercises
- List of non-archived exercises; add, rename, archive.
- Exercise detail: progress chart with a metric toggle:
  - **Top set** — heaviest done-set weight per session
  - **Est. 1RM** — max Epley e1RM per session: `w × (1 + reps/30)`; for reps = 1, e1RM = w
  - **Volume** — Σ weight × reps of done sets per session
- Below the chart: recent sessions for that exercise.

### Body
- Quick entry for today (weight and/or body fat %); editing an existing date overwrites that date's entry.
- Bodyweight chart with raw points + 7-day trailing average line (average of entries within the 7 calendar days ending on each entry's date).
- Body fat % chart.
- List of entries, editable/deletable.

### Settings
- Templates: create, rename, edit exercise list/order, delete.
- **Export JSON** — full backup of all tables, with `version` field.
- **Import JSON** — validates entire file first; on success replaces all data (after confirmation). Invalid file → error message, nothing written.
- **Export CSV** — one row per done set: `date, workout_id, exercise, set_number, weight_kg, reps`.

## Code structure

```
src/
  db/        Dexie schema, seed, query helpers (getActiveWorkout, getLastSessionFor, ...)
  lib/       Pure functions: e1rm, volume, topSet, rollingAverage, formatSets,
             validateBackup, toCsv
  screens/   Train/, History/, Exercises/, Body/, Settings/
  components/ Shared UI (SetRow, ExercisePicker, Chart wrappers, TabBar)
```

`lib/` has no dependency on Dexie or React. Screens use `dexie-react-hooks` (`useLiveQuery`) for reactive reads.

## Reliability

- Request `navigator.storage.persist()` on first launch to reduce risk of eviction.
- Settings shows when the last export happened as a gentle backup reminder.
- Import is all-or-nothing inside a single Dexie transaction.

## Testing

- Vitest unit tests for everything in `lib/`, plus `getLastSessionFor` (using `fake-indexeddb`) and `validateBackup` (good, malformed, wrong-version inputs).
- Manual verification in a mobile-sized browser viewport: log a workout, see "last time" in the next one, see charts update, export → import round trip.
