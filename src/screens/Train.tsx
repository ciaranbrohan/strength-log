import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { getActiveWorkout } from '../db/queries';
import { startWorkout } from '../db/actions';
import WorkoutEditor from '../components/WorkoutEditor';
import { workoutVolume } from '../lib/calc';
import { formatKg } from '../lib/format';
import type { Workout } from '../types';

export default function Train() {
  const active = useLiveQuery(() => getActiveWorkout().then((w) => w ?? null), []);
  const templates = useLiveQuery(() => db.templates.toArray(), []);

  if (active === undefined) return null;
  if (active) return <ActiveWorkout workout={active} templateName={templates?.find((t) => t.id === active.templateId)?.name} />;

  return (
    <>
      <h1>Train</h1>
      <h2>Start from a template</h2>
      {templates?.length ? (
        <ul className="list">
          {templates.map((t) => (
            <li key={t.id}>
              <button className="list-item" onClick={() => startWorkout(t)}>
                <span>
                  <strong>{t.name}</strong>
                  <br />
                  <span className="muted small">{t.exerciseIds.length} exercises</span>
                </span>
                <span className="muted">Start →</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">No templates yet. Create them in Settings.</p>
      )}
      <h2>Or</h2>
      <button className="btn btn-primary btn-block" onClick={() => startWorkout()}>
        Start empty workout
      </button>
    </>
  );
}

function useElapsed(startedAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const mins = Math.max(0, Math.floor((now - Date.parse(startedAt)) / 60_000));
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function ActiveWorkout({ workout, templateName }: { workout: Workout; templateName?: string }) {
  const elapsed = useElapsed(workout.startedAt);
  const doneSets = workout.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);

  const finish = async () => {
    if (!doneSets && !confirm('No sets are ticked as done. Finish anyway?')) return;
    await db.workouts.update(workout.id, { finishedAt: new Date().toISOString() });
    window.scrollTo(0, 0);
  };

  const discard = async () => {
    if (confirm('Discard this workout? Everything logged in it will be deleted.')) await db.workouts.delete(workout.id);
  };

  return (
    <>
      <div className="spread">
        <h1>{templateName ?? 'Workout'}</h1>
        <span className="muted small num">{elapsed}</span>
      </div>
      <p className="muted small" style={{ marginTop: -10 }}>
        {doneSets} sets done · {formatKg(workoutVolume(workout.entries))} kg volume
      </p>
      <WorkoutEditor key={workout.id} workout={workout} />
      <div className="toolbar" style={{ marginTop: 20 }}>
        <button className="btn btn-danger" onClick={discard}>
          Discard
        </button>
        <button className="btn btn-primary" onClick={finish}>
          Finish workout
        </button>
      </div>
    </>
  );
}
