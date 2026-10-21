import type { TemplateTarget } from '../types';

/** Reps to pre-fill from a target like "9-12" (lower end), "11/11" or "4, last AMRAP". */
export function targetRepsNumber(reps: string): number {
  const match = reps.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

export const formatTarget = (t: TemplateTarget): string => `${t.sets}×${t.reps}`;
