import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getLastSessionFor } from '../db/queries';
import { nextSet, prefilledEntry } from '../db/actions';
import { formatDate, formatSets } from '../lib/format';
import type { SetEntry, Workout, WorkoutEntry } from '../types';
import ExercisePicker from './ExercisePicker';
import NumField from './NumField';

/** Applies a change to the latest stored copy of the workout and saves it immediately. */
function save(workout: Workout, change: (w: Workout) => void) {
  return db.transaction('rw', db.workouts, async () => {
    const latest = await db.workouts.get(workout.id);
    if (!latest) return;
    change(latest);
    await db.workouts.put(latest);
  });
}

export default function WorkoutEditor({ workout }: { workout: Workout }) {
  const [picking, setPicking] = useState(false);
  const names = useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e.name])), []);

  const addExercise = async (exerciseId: string) => {
    setPicking(false);
    const entry = await prefilledEntry(exerciseId, workout.id);
    await save(workout, (w) => w.entries.push(entry));
  };

  return (
    <div className="stack">
      {workout.entries.map((entry, i) => (
        <EntryCard
          key={`${entry.exerciseId}-${i}`}
          workout={workout}
          entry={entry}
          index={i}
          name={names?.get(entry.exerciseId) ?? '…'}
        />
      ))}

      {!workout.entries.length && <p className="empty">No exercises yet. Add one to get going.</p>}

      <button className="btn btn-block" onClick={() => setPicking(true)}>
        + Add exercise
      </button>

      <textarea
        className="field"
        rows={2}
        placeholder="Notes (how it felt, sleep, niggles…)"
        defaultValue={workout.notes ?? ''}
        onBlur={(e) => {
          const notes = e.target.value.trim() || undefined;
          if (notes !== workout.notes) save(workout, (w) => (w.notes = notes));
        }}
      />

      {picking && (
        <ExercisePicker
          onPick={addExercise}
          onClose={() => setPicking(false)}
          exclude={workout.entries.map((e) => e.exerciseId)}
        />
      )}
    </div>
  );
}

interface EntryProps {
  workout: Workout;
  entry: WorkoutEntry;
  index: number;
  name: string;
}

function EntryCard({ workout, entry, index, name }: EntryProps) {
  const last = useLiveQuery(
    () => getLastSessionFor(entry.exerciseId, workout.id).then((l) => l ?? null),
    [entry.exerciseId, workout.id],
  );
  const count = workout.entries.length;

  const updateEntry = (change: (e: WorkoutEntry) => void) => save(workout, (w) => change(w.entries[index]));

  const updateSet = (setIndex: number, patch: Partial<SetEntry>) =>
    updateEntry((e) => Object.assign(e.sets[setIndex], patch));

  const move = (delta: number) =>
    save(workout, (w) => {
      const [item] = w.entries.splice(index, 1);
      w.entries.splice(index + delta, 0, item);
    });

  const remove = () => {
    const hasDone = entry.sets.some((s) => s.done);
    if (hasDone && !confirm(`Remove ${name} and its completed sets?`)) return;
    save(workout, (w) => w.entries.splice(index, 1));
  };

  return (
    <section className="card exercise-card">
      <div className="exercise-head">
        <h3 className="grow" style={{ paddingTop: 8 }}>
          {name}
        </h3>
        <button className="icon-btn" aria-label="Move up" disabled={index === 0} onClick={() => move(-1)}>
          ↑
        </button>
        <button className="icon-btn" aria-label="Move down" disabled={index === count - 1} onClick={() => move(1)}>
          ↓
        </button>
        <button className="icon-btn" aria-label={`Remove ${name}`} onClick={remove}>
          ✕
        </button>
      </div>
      <p className="last-time">
        {last === undefined ? ' ' : last ? (
          <>
            Last time ({formatDate(last.startedAt)}): <strong>{formatSets(last.entry.sets)}</strong>
          </>
        ) : (
          'First time logging this'
        )}
      </p>

      <div className="set-grid">
        <span className="head" style={{ textAlign: 'center' }}>
          Set
        </span>
        <span className="head">kg</span>
        <span className="head">Reps</span>
        <span />
        <span />
        {entry.sets.map((set, si) => (
          <div key={si} className={`set-row ${set.done ? 'is-done' : ''}`} style={{ display: 'contents' }}>
            <span className="set-num">{si + 1}</span>
            <NumField
              value={set.weightKg}
              ariaLabel={`Set ${si + 1} weight`}
              onChange={(v) => updateSet(si, { weightKg: v ?? 0 })}
            />
            <NumField
              value={set.reps}
              integer
              ariaLabel={`Set ${si + 1} reps`}
              onChange={(v) => updateSet(si, { reps: v ?? 0 })}
            />
            <button
              className="done-btn"
              aria-pressed={set.done}
              aria-label={`Mark set ${si + 1} ${set.done ? 'not done' : 'done'}`}
              onClick={() => updateSet(si, { done: !set.done })}
            >
              ✓
            </button>
            <button
              className="icon-btn"
              aria-label={`Delete set ${si + 1}`}
              onClick={() => updateEntry((e) => e.sets.splice(si, 1))}
            >
              −
            </button>
          </div>
        ))}
      </div>

      <button
        className="btn btn-sm btn-block"
        style={{ marginTop: 10 }}
        onClick={() => updateEntry((e) => e.sets.push(nextSet(e.sets, last?.entry.sets)))}
      >
        + Set
      </button>
    </section>
  );
}
