import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { newId } from '../lib/id';

interface Props {
  onPick: (exerciseId: string) => void;
  onClose: () => void;
  exclude?: string[];
}

export default function ExercisePicker({ onPick, onClose, exclude = [] }: Props) {
  const [query, setQuery] = useState('');
  const exercises = useLiveQuery(() => db.exercises.orderBy('name').filter((e) => !e.archived).toArray(), []);
  const q = query.trim().toLowerCase();
  const matches = (exercises ?? []).filter((e) => !exclude.includes(e.id) && e.name.toLowerCase().includes(q));
  const exact = exercises?.some((e) => e.name.toLowerCase() === q);

  const create = async () => {
    const id = newId();
    await db.exercises.add({ id, name: query.trim() });
    onPick(id);
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Add exercise" onClick={(e) => e.stopPropagation()}>
        <div className="spread">
          <h3>Add exercise</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Cancel
          </button>
        </div>
        <input
          className="field"
          style={{ marginTop: 12 }}
          placeholder="Search or create…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="sheet-body">
          <ul className="list">
            {q && !exact && (
              <li>
                <button className="list-item" onClick={create}>
                  <span>
                    Create <strong>“{query.trim()}”</strong>
                  </span>
                  <span className="muted">+</span>
                </button>
              </li>
            )}
            {matches.map((e) => (
              <li key={e.id}>
                <button className="list-item" onClick={() => onPick(e.id)}>
                  {e.name}
                </button>
              </li>
            ))}
          </ul>
          {!matches.length && !q && <p className="empty">No exercises yet.</p>}
        </div>
      </div>
    </div>
  );
}
