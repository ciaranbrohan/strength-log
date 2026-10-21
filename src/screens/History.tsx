import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { finishedWorkouts } from '../db/queries';
import WorkoutEditor from '../components/WorkoutEditor';
import { workoutVolume } from '../lib/calc';
import { formatDate, formatKg } from '../lib/format';

export default function History() {
  const [openId, setOpenId] = useState<string | null>(null);
  const workouts = useLiveQuery(finishedWorkouts, []);
  const templates = useLiveQuery(async () => new Map((await db.templates.toArray()).map((t) => [t.id, t.name])), []);
  const open = workouts?.find((w) => w.id === openId);

  if (open) {
    const remove = async () => {
      if (!confirm('Delete this workout permanently?')) return;
      setOpenId(null);
      await db.workouts.delete(open.id);
    };
    return (
      <>
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: -10 }} onClick={() => setOpenId(null)}>
          ← History
        </button>
        <h1>{formatDate(open.startedAt)}</h1>
        <p className="muted small" style={{ marginTop: -10 }}>
          {(open.templateId && templates?.get(open.templateId)) || 'Freeform'} · edits save automatically
        </p>
        <WorkoutEditor key={open.id} workout={open} />
        <button className="btn btn-danger btn-block" style={{ marginTop: 20 }} onClick={remove}>
          Delete workout
        </button>
      </>
    );
  }

  return (
    <>
      <h1>History</h1>
      {workouts && !workouts.length && <p className="empty">Finished workouts will show up here.</p>}
      <ul className="list">
        {workouts?.map((w) => (
          <li key={w.id}>
            <button className="list-item" onClick={() => setOpenId(w.id)}>
              <span>
                <strong>{formatDate(w.startedAt)}</strong>
                <br />
                <span className="muted small">
                  {(w.templateId && templates?.get(w.templateId)) || 'Freeform'} · {w.entries.length} exercises
                </span>
              </span>
              <span className="muted small num">{formatKg(workoutVolume(w.entries))} kg</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
