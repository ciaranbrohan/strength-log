import { describe, expect, it } from 'vitest';
import { BACKUP_VERSION, toCsv, validateBackup } from './backup';
import type { Backup, Exercise, Workout } from '../types';

const good: Backup = {
  version: BACKUP_VERSION,
  exportedAt: '2026-10-21T10:00:00.000Z',
  exercises: [{ id: 'e1', name: 'Bench Press' }],
  templates: [{ id: 't1', name: 'Push', exerciseIds: ['e1'] }],
  workouts: [
    {
      id: 'w1',
      startedAt: '2026-10-20T18:00:00.000Z',
      finishedAt: '2026-10-20T19:00:00.000Z',
      entries: [{ exerciseId: 'e1', sets: [{ weightKg: 100, reps: 5, done: true }] }],
    },
  ],
  body: [{ date: '2026-10-20', weightKg: 82.4 }],
};

describe('validateBackup', () => {
  it('accepts a valid backup', () => {
    const r = validateBackup(JSON.parse(JSON.stringify(good)));
    expect(r.ok).toBe(true);
  });
  it('rejects non-objects', () => expect(validateBackup('nope').ok).toBe(false));
  it('rejects wrong version', () => expect(validateBackup({ ...good, version: 99 }).ok).toBe(false));
  it('rejects missing arrays', () => {
    const { body: _body, ...rest } = good;
    expect(validateBackup(rest).ok).toBe(false);
  });
  it('rejects malformed sets', () => {
    const bad = JSON.parse(JSON.stringify(good));
    bad.workouts[0].entries[0].sets[0].reps = '5';
    const r = validateBackup(bad);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/workout/i);
  });
  it('rejects malformed body entries', () => {
    const bad = JSON.parse(JSON.stringify(good));
    bad.body[0].weightKg = 'heavy';
    expect(validateBackup(bad).ok).toBe(false);
  });
});

describe('toCsv', () => {
  it('writes one row per done set of finished workouts', () => {
    const exercises: Exercise[] = [{ id: 'e1', name: 'Bench, "Paused"' }];
    const workouts: Workout[] = [
      {
        id: 'w1',
        startedAt: '2026-10-20T18:00:00.000Z',
        finishedAt: '2026-10-20T19:00:00.000Z',
        entries: [
          {
            exerciseId: 'e1',
            sets: [
              { weightKg: 100, reps: 5, done: true },
              { weightKg: 105, reps: 3, done: false },
              { weightKg: 102.5, reps: 4, done: true },
            ],
          },
        ],
      },
      { id: 'w2', startedAt: '2026-10-21T18:00:00.000Z', entries: [{ exerciseId: 'e1', sets: [{ weightKg: 1, reps: 1, done: true }] }] },
    ];
    expect(toCsv(workouts, exercises).split('\n')).toEqual([
      'date,workout_id,exercise,set_number,weight_kg,reps',
      '2026-10-20,w1,"Bench, ""Paused""",1,100,5',
      '2026-10-20,w1,"Bench, ""Paused""",2,102.5,4',
    ]);
  });
});

describe('validateBackup targets', () => {
  it('accepts templates with targets', () => {
    const b = { ...good, templates: [{ id: 't1', name: 'Push', exerciseIds: ['e1'], targets: { e1: { sets: 5, reps: '4' } } }] };
    expect(validateBackup(b).ok).toBe(true);
  });
  it('rejects malformed targets', () => {
    const b = { ...good, templates: [{ id: 't1', name: 'Push', exerciseIds: ['e1'], targets: { e1: { sets: '5', reps: 4 } } }] };
    expect(validateBackup(b).ok).toBe(false);
  });
});
