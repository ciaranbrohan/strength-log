import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { exerciseHistory } from '../db/queries';
import LineChartCard from '../components/LineChartCard';
import { newId } from '../lib/id';
import { formatDate, formatKg, formatSets, isoDate } from '../lib/format';
import type { Exercise } from '../types';

export default function Exercises() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').filter((e) => !e.archived).toArray(), []);
  const open = exercises?.find((e) => e.id === openId);

  if (open) return <ExerciseDetail exercise={open} onBack={() => setOpenId(null)} />;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await db.exercises.add({ id: newId(), name: trimmed });
    setName('');
  };

  return (
    <>
      <h1>Exercises</h1>
      <form className="row" onSubmit={add} style={{ marginBottom: 16 }}>
        <input className="field grow" placeholder="New exercise name" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn" type="submit" disabled={!name.trim()}>
          Add
        </button>
      </form>
      <ul className="list">
        {exercises?.map((e) => (
          <li key={e.id}>
            <button className="list-item" onClick={() => setOpenId(e.id)}>
              {e.name}
              <span className="muted">›</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

type Metric = 'top' | 'e1rm' | 'volume';
const METRICS: { key: Metric; label: string }[] = [
  { key: 'top', label: 'Top set' },
  { key: 'e1rm', label: 'Est. 1RM' },
  { key: 'volume', label: 'Volume' },
];

function ExerciseDetail({ exercise, onBack }: { exercise: Exercise; onBack: () => void }) {
  const [metric, setMetric] = useState<Metric>('e1rm');
  const history = useLiveQuery(() => exerciseHistory(exercise.id), [exercise.id]);
  const data = (history ?? []).map((p) => ({ date: isoDate(new Date(p.startedAt)), value: Math.round(p[metric] * 10) / 10 }));
  const best = history?.length ? Math.max(...history.map((p) => p[metric])) : null;

  const rename = async () => {
    const next = prompt('Rename exercise', exercise.name)?.trim();
    if (next) await db.exercises.update(exercise.id, { name: next });
  };

  const archive = async () => {
    if (!confirm(`Archive ${exercise.name}? It will be hidden from lists, but its history is kept.`)) return;
    await db.exercises.update(exercise.id, { archived: true });
    onBack();
  };

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginLeft: -10 }} onClick={onBack}>
        ← Exercises
      </button>
      <h1>{exercise.name}</h1>

      <div className="segmented" role="group" aria-label="Chart metric">
        {METRICS.map((m) => (
          <button key={m.key} aria-pressed={metric === m.key} onClick={() => setMetric(m.key)}>
            {m.label}
          </button>
        ))}
      </div>

      {best !== null && (
        <p className="muted small" style={{ margin: '12px 0 8px' }}>
          Best: <span className="stat" style={{ color: 'var(--text)', fontSize: '1.1rem' }}>{formatKg(Math.round(best * 10) / 10)} kg</span>
        </p>
      )}
      <div style={{ marginTop: 12 }}>
        <LineChartCard data={data} series={[{ key: 'value', label: METRICS.find((m) => m.key === metric)!.label, color: '#f5a524' }]} unit="kg" />
      </div>

      <h2>Recent sessions</h2>
      {history && !history.length && <p className="muted small">No completed sets logged yet.</p>}
      <ul className="list">
        {[...(history ?? [])].reverse().slice(0, 12).map((p) => (
          <li key={p.workoutId} className="card spread">
            <span className="small">{formatDate(p.startedAt)}</span>
            <span className="small num">{formatSets(p.entry.sets)}</span>
          </li>
        ))}
      </ul>

      <div className="toolbar" style={{ marginTop: 24 }}>
        <button className="btn" onClick={rename}>
          Rename
        </button>
        <button className="btn btn-danger" onClick={archive}>
          Archive
        </button>
      </div>
    </>
  );
}
