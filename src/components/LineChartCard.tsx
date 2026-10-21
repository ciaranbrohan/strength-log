import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { shortDate } from '../lib/format';

export interface Series {
  key: string;
  label: string;
  color: string;
  dots?: boolean;
  dashed?: boolean;
}

interface Props {
  data: Record<string, number | string | undefined>[];
  series: Series[];
  unit: string;
  xKey?: string;
}

const AXIS = '#8a9099';

export default function LineChartCard({ data, series, unit, xKey = 'date' }: Props) {
  if (data.length < 2) {
    return <div className="card empty small">Log at least two sessions to see a chart.</div>;
  }
  return (
    <div className="card chart-card">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={AXIS} strokeOpacity={0.15} vertical={false} />
          <XAxis
            dataKey={xKey}
            tickFormatter={(v: string) => shortDate(v)}
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fill: AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(v: number) => String(Math.round(v * 10) / 10)}
          />
          <Tooltip
            labelFormatter={(v) => shortDate(String(v))}
            formatter={(v) => `${Math.round(Number(v) * 10) / 10} ${unit}`}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
            labelStyle={{ color: 'var(--muted)' }}
          />
          {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={s.dashed ? 1.5 : 2.5}
              strokeDasharray={s.dashed ? '4 3' : undefined}
              dot={s.dots === false ? false : { r: 3, fill: s.color, strokeWidth: 0 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
