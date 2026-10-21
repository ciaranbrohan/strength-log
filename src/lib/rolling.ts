export interface DatedValue {
  date: string; // YYYY-MM-DD
  value: number;
}

const DAY_MS = 86_400_000;
const dayNumber = (date: string) => Math.round(Date.parse(`${date}T00:00:00Z`) / DAY_MS);

/** Mean of all values within the 7 calendar days ending on each point's date. */
export function rollingAverage(points: DatedValue[], days = 7): (DatedValue & { avg: number })[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((p) => {
    const end = dayNumber(p.date);
    const window = sorted.filter((q) => {
      const d = dayNumber(q.date);
      return d <= end && d > end - days;
    });
    const avg = window.reduce((sum, q) => sum + q.value, 0) / window.length;
    return { ...p, avg: Math.round(avg * 100) / 100 };
  });
}
