import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { exportAll, importAll } from '../db/queries';
import ExercisePicker from '../components/ExercisePicker';
import { toCsv, validateBackup } from '../lib/backup';
import { newId } from '../lib/id';
import { formatDate, todayIso } from '../lib/format';
import type { Template } from '../types';

const LAST_EXPORT_KEY = 'strength-log:last-export';

function readLastExport(): string | null {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY);
  } catch {
    return null;
  }
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Settings() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const templates = useLiveQuery(() => db.templates.toArray(), []);
  const editing = templates?.find((t) => t.id === editingId);

  if (editing) return <TemplateEditor template={editing} onBack={() => setEditingId(null)} />;

  const createTemplate = async () => {
    const name = prompt('Template name (e.g. Push A)')?.trim();
    if (!name) return;
    const id = newId();
    await db.templates.add({ id, name, exerciseIds: [] });
    setEditingId(id);
  };

  return (
    <>
      <h1>Settings</h1>
      <h2>Templates</h2>
      <ul className="list">
        {templates?.map((t) => (
          <li key={t.id}>
            <button className="list-item" onClick={() => setEditingId(t.id)}>
              <span>
                {t.name}
                <br />
                <span className="muted small">{t.exerciseIds.length} exercises</span>
              </span>
              <span className="muted">›</span>
            </button>
          </li>
        ))}
      </ul>
      <button className="btn btn-block" style={{ marginTop: 8 }} onClick={createTemplate}>
        + New template
      </button>
      <DataSection />
    </>
  );
}

function DataSection() {
  const [lastExport, setLastExport] = useState(readLastExport);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const exportJson = async () => {
    const backup = await exportAll();
    download(`strength-log-${todayIso()}.json`, JSON.stringify(backup, null, 2), 'application/json');
    try {
      localStorage.setItem(LAST_EXPORT_KEY, backup.exportedAt);
    } catch {
      // ignore
    }
    setLastExport(backup.exportedAt);
  };

  const exportCsv = async () => {
    const [workouts, exercises] = await Promise.all([db.workouts.toArray(), db.exercises.toArray()]);
    download(`strength-log-sets-${todayIso()}.csv`, toCsv(workouts, exercises), 'text/csv');
  };

  const importJson = async (file: File) => {
    setMessage(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      return setMessage({ text: 'That file is not valid JSON.', error: true });
    }
    const result = validateBackup(parsed);
    if (!result.ok) return setMessage({ text: result.error, error: true });
    const { workouts, body } = result.data;
    if (!confirm(`Replace ALL current data with this backup (${workouts.length} workouts, ${body.length} body entries)?`)) return;
    try {
      await importAll(result.data);
      setMessage({ text: 'Backup restored.' });
    } catch (err) {
      setMessage({ text: `Import failed, nothing was changed. ${String(err)}`, error: true });
    }
  };

  return (
    <>
      <h2>Your data</h2>
      <p className="muted small" style={{ marginTop: 0 }}>
        Everything is stored only on this device. Export a backup now and then.
        <br />
        Last backup: {lastExport ? formatDate(lastExport) : 'never'}
      </p>
      <div className="stack">
        <button className="btn btn-primary btn-block" onClick={exportJson}>
          Export backup (JSON)
        </button>
        <button className="btn btn-block" onClick={() => fileInput.current?.click()}>
          Restore from backup…
        </button>
        <button className="btn btn-block" onClick={exportCsv}>
          Export sets (CSV)
        </button>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) importJson(file);
        }}
      />
      {message && <p className={message.error ? 'error' : 'muted small'}>{message.text}</p>}
    </>
  );
}

function TemplateEditor({ template, onBack }: { template: Template; onBack: () => void }) {
  const [picking, setPicking] = useState(false);
  const names = useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e.name])), []);

  const setIds = (exerciseIds: string[]) => db.templates.update(template.id, { exerciseIds });

  const move = (i: number, delta: number) => {
    const ids = [...template.exerciseIds];
    const [item] = ids.splice(i, 1);
    ids.splice(i + delta, 0, item);
    setIds(ids);
  };

  const rename = async () => {
    const name = prompt('Template name', template.name)?.trim();
    if (name) await db.templates.update(template.id, { name });
  };

  const remove = async () => {
    if (!confirm(`Delete template "${template.name}"? Past workouts are kept.`)) return;
    onBack();
    await db.templates.delete(template.id);
  };

  return (
    <>
      <button className="btn btn-ghost btn-sm" style={{ marginLeft: -10 }} onClick={onBack}>
        ← Settings
      </button>
      <h1>{template.name}</h1>
      {!template.exerciseIds.length && <p className="muted small">Add the exercises this session usually includes.</p>}
      <ul className="list">
        {template.exerciseIds.map((id, i) => (
          <li key={id} className="card row" style={{ padding: '4px 4px 4px 14px' }}>
            <span className="grow">{names?.get(id) ?? '…'}</span>
            <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              ↑
            </button>
            <button className="icon-btn" aria-label="Move down" disabled={i === template.exerciseIds.length - 1} onClick={() => move(i, 1)}>
              ↓
            </button>
            <button className="icon-btn" aria-label="Remove" onClick={() => setIds(template.exerciseIds.filter((x) => x !== id))}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      <button className="btn btn-block" style={{ marginTop: 8 }} onClick={() => setPicking(true)}>
        + Add exercise
      </button>
      <div className="toolbar" style={{ marginTop: 24 }}>
        <button className="btn" onClick={rename}>
          Rename
        </button>
        <button className="btn btn-danger" onClick={remove}>
          Delete
        </button>
      </div>
      {picking && (
        <ExercisePicker
          exclude={template.exerciseIds}
          onClose={() => setPicking(false)}
          onPick={(id) => {
            setPicking(false);
            setIds([...template.exerciseIds, id]);
          }}
        />
      )}
    </>
  );
}
