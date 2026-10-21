# Strength Log Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the offline, mobile-first strength journal PWA described in `docs/superpowers/specs/2026-10-21-strength-log-design.md`.

**Architecture:** Vite + React SPA. All persistence in IndexedDB via Dexie; screens read reactively with `useLiveQuery`. Pure calculation logic lives in `src/lib/` with no React/Dexie dependency and is unit-tested with Vitest. Navigation is a simple tab state (no router).

**Tech Stack:** Vite 8, React 19, TypeScript, Dexie 4 + dexie-react-hooks, vite-plugin-pwa, Recharts, Vitest + fake-indexeddb.

---

## File map

```
index.html
vite.config.ts                 Vite + React + PWA + Vitest config
public/icon.svg                App icon
src/main.tsx                   Mount, request persistent storage, seed DB
src/App.tsx                    Tab state + TabBar + active screen
src/styles.css                 Mobile-first styles, light/dark tokens
src/types.ts                   Exercise, Template, Workout, WorkoutEntry, SetEntry, BodyEntry, Backup
src/lib/id.ts                  newId()
src/lib/calc.ts                e1rm, sessionVolume, topSet, bestE1rm, workoutVolume
src/lib/format.ts              formatSets, formatDate, todayIso
src/lib/rolling.ts             rollingAverage (7-day trailing, by calendar date)
src/lib/backup.ts              BACKUP_VERSION, validateBackup, toCsv
src/lib/*.test.ts              Unit tests for each lib file
src/db/db.ts                   Dexie schema + seedIfEmpty
src/db/queries.ts              getActiveWorkout, getLastSessionFor, exerciseHistory, exportAll, importAll
src/db/queries.test.ts         Tests with fake-indexeddb
src/components/TabBar.tsx
src/components/WorkoutEditor.tsx   Shared editor for active + historical workouts
src/components/ExercisePicker.tsx
src/components/LineChartCard.tsx   Recharts wrapper
src/screens/Train.tsx
src/screens/History.tsx
src/screens/Exercises.tsx
src/screens/Body.tsx
src/screens/Settings.tsx
```

## Task 1: Scaffold

- [ ] Create `package.json` with scripts `dev`, `build` (`tsc -b && vite build`), `test` (`vitest run`), `preview`.
- [ ] Install deps: `react react-dom dexie dexie-react-hooks recharts`; dev: `vite @vitejs/plugin-react vite-plugin-pwa typescript @types/react @types/react-dom vitest fake-indexeddb`.
- [ ] Add `tsconfig.json`, `vite.config.ts` (PWA manifest: name "Strength Log", `display: standalone`, `theme_color`, svg icon; `registerType: 'autoUpdate'`; Vitest `environment: 'node'`).
- [ ] Run `npm run build` → succeeds. Commit.

## Task 2: Types + lib (TDD)

Behaviour to test first, then implement:

- `e1rm(w, reps)`: Epley `w * (1 + reps/30)`; reps 1 → `w`; reps 0 → 0.
- `topSet(sets)`: max `weightKg` of `done` sets, `null` if none.
- `bestE1rm(sets)`: max e1rm of done sets, `null` if none.
- `sessionVolume(sets)`: Σ weight × reps of done sets.
- `formatSets(sets)`: done sets only; identical sets → `3×5 @ 100kg`; otherwise `100×5, 105×3`; none → `''`. Weight trims trailing zeros (`102.5`).
- `rollingAverage(points)`: input `{date, value}[]` sorted any order; output sorted asc with `avg` = mean of values whose date is within the 7 calendar days ending on that point's date.
- `validateBackup(json)`: returns `{ok: true, data}` or `{ok: false, error}`. Rejects non-object, wrong `version`, missing arrays, malformed records (wrong field types).
- `toCsv(workouts, exercises)`: header `date,workout_id,exercise,set_number,weight_kg,reps`, one row per done set of finished workouts, names quoted when they contain commas/quotes.

Run `npm test` → all pass. Commit.

## Task 3: DB layer (TDD with fake-indexeddb)

- Schema v1: `exercises: 'id, name'`, `templates: 'id'`, `workouts: 'id, startedAt, finishedAt'`, `body: 'date'`.
- `seedIfEmpty()` adds the 10 starter exercises only when `exercises` is empty.
- `getActiveWorkout()` → workout with no `finishedAt` (filter), or `undefined`.
- `getLastSessionFor(exerciseId, excludeWorkoutId?)` → the `WorkoutEntry` (+ date) from the most recent *finished* workout containing that exercise with ≥1 done set.
- `exerciseHistory(exerciseId)` → `{date, top, e1rm, volume}[]` ascending, one per finished workout.
- `exportAll()` → `Backup`; `importAll(backup)` → clears and bulk-adds all tables in one `rw` transaction.

Tests: seeding idempotent; last-session picks newest finished, ignores active and not-done sets; history ordering/values; export→import round trip. Commit.

## Task 4: App shell + styles

- `App.tsx` with tabs Train/History/Exercises/Body/Settings, bottom fixed `TabBar`, safe-area padding.
- `main.tsx`: `navigator.storage?.persist?.()`, `seedIfEmpty()`, render.
- `styles.css`: CSS tokens with dark-mode, large tap targets (≥44px), numeric inputs with `inputmode="decimal"`.
- Build passes. Commit.

## Task 5: Workout editor + Train + History

- `WorkoutEditor({workoutId})`: live query workout + exercises; per entry shows name, "Last time" line via `getLastSessionFor`, set rows (weight, reps, done toggle, delete), "+ Set" (pre-fill from last time's same index, else previous set in session, else empty), move up/down, remove exercise, `ExercisePicker` to add, notes textarea. Every change `db.workouts.put`.
- Train: when no active workout → template buttons + "Empty workout"; else editor + Finish / Discard (confirm).
- History: finished workouts desc with date, template name, exercise count, volume; tap opens editor with Back + Delete (confirm).
- Manual check in browser. Commit.

## Task 6: Exercises + Body screens

- Exercises: list, add, rename, archive. Detail: metric toggle (Top set / Est. 1RM / Volume) chart via `LineChartCard`, recent sessions with `formatSets`.
- Body: form for date (default today), weight, body fat %; `put` by date (only provided fields, merging existing). Bodyweight chart with raw + 7-day avg lines; body-fat chart; entries list with delete.
- Commit.

## Task 7: Settings

- Templates: create, rename, add/remove/reorder exercises, delete.
- Export JSON (download `strength-log-YYYY-MM-DD.json`, store `lastExportAt` in localStorage, show it).
- Import JSON: parse → `validateBackup` → confirm → `importAll`; show error on failure.
- Export CSV.
- Commit.

## Task 8: Verification

- `npm test` and `npm run build` pass.
- Run dev server, mobile viewport: create a workout from a template, log sets, finish; start another and confirm "Last time" + pre-fill; check exercise chart; add body entries and see trend; export → import round trip.
