import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import LineChartCard from '../components/LineChartCard';
import NumField from '../components/NumField';
import { rollingAverage } from '../lib/rolling';
import { formatDate, formatKg, todayIso } from '../lib/format';

export default function Body() {
  const entries = useLiveQuery(() => db.body.orderBy('date').reverse().toArray(), []);
  const [date, setDate] = useState(todayIso);
  const [weight, setWeight] = useState<number | undefined>();
  const [fat, setFat] = useState<number | undefined>();

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (weight === undefined && fat === undefined) return;
    const existing = await db.body.get(date);
    await db.body.put({
      date,
      weightKg: weight ?? existing?.weightKg,
      bodyFatPct: fat ?? existing?.bodyFatPct,
    });
    setWeight(undefined);
    setFat(undefined);
  };

  const weights = rollingAverage(
    (entries ?? []).filter((e) => e.weightKg !== undefined).map((e) => ({ date: e.date, value: e.weightKg! })),
  ).map((p) => ({ date: p.date, weight: p.value, avg: p.avg }));
  const fats = [...(entries ?? [])]
    .filter((e) => e.bodyFatPct !== undefined)
    .reverse()
    .map((e) => ({ date: e.date, fat: e.bodyFatPct }));
  const latestAvg = weights.at(-1)?.avg;

  return (
    <>
      <h1>Body</h1>
      <form className="card" onSubmit={save}>
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div className="grow">
            <label className="label" htmlFor="body-date">Date</label>
            <input id="body-date" className="field" type="date" value={date} max={todayIso()} onChange={(e) => setDate(e.target.value || todayIso())} />
          </div>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <div className="grow">
            <label className="label">Weight (kg)</label>
            <NumField className="field" value={weight} onChange={setWeight} placeholder="e.g. 82.4" ariaLabel="Bodyweight in kg" />
          </div>
          <div className="grow">
            <label className="label">Body fat %</label>
            <NumField className="field" value={fat} onChange={setFat} placeholder="optional" ariaLabel="Body fat percentage" />
          </div>
        </div>
        <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} type="submit" disabled={weight === undefined && fat === undefined}>
          Save
        </button>
      </form>

      <h2>Bodyweight</h2>
      {latestAvg !== undefined && (
        <p className="muted small" style={{ marginTop: 0 }}>
          7-day average: <span className="stat" style={{ color: 'var(--text)', fontSize: '1.1rem' }}>{formatKg(latestAvg)} kg</span>
        </p>
      )}
      <LineChartCard
        data={weights}
        unit="kg"
        series={[
          { key: 'weight', label: 'Weigh-in', color: '#8a9099', dashed: true },
          { key: 'avg', label: '7-day avg', color: '#f5a524', dots: false },
        ]}
      />

      <h2>Body fat</h2>
      <LineChartCard data={fats} unit="%" series={[{ key: 'fat', label: 'Body fat', color: '#4f9cf9' }]} />

      <h2>Entries</h2>
      {entries && !entries.length && <p className="muted small">No entries yet.</p>}
      <ul className="list">
        {entries?.map((e) => (
          <li key={e.date} className="card spread">
            <span className="small">{formatDate(e.date)}</span>
            <span className="row small num">
              {e.weightKg !== undefined && <span>{formatKg(e.weightKg)} kg</span>}
              {e.bodyFatPct !== undefined && <span className="muted">{formatKg(e.bodyFatPct)}%</span>}
              <button
                className="icon-btn"
                aria-label={`Delete entry for ${e.date}`}
                onClick={() => confirm(`Delete entry for ${formatDate(e.date)}?`) && db.body.delete(e.date)}
              >
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
