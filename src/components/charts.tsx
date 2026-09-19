import {
  Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const tick = { fill: 'var(--muted)', fontSize: 12 };

function TipBox({ active, payload, label, unit, labelPrefix }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string | number; unit?: string; labelPrefix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      <div className="mb-0.5 text-muted">{labelPrefix}{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="font-semibold tabular" style={{ color: p.color }}>
          {Math.round(p.value * 10) / 10}{unit}
        </div>
      ))}
    </div>
  );
}

/** Per-second WPM for one session. */
export function WpmChart({ series, step = 1, height = 220 }: { series: number[]; step?: number; height?: number }) {
  if (series.length < 2) {
    return <div className="grid place-items-center text-sm text-muted" style={{ height }}>Type a little longer to see your speed graph.</div>;
  }
  const data = series.map((wpm, i) => ({ t: (i + 1) * step, wpm }));
  return (
    <div style={{ height }} role="img" aria-label={`Line chart of words per minute over ${data[data.length - 1].t} seconds. Ends at ${Math.round(series[series.length - 1])} WPM.`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="wpmFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="t" tick={tick} tickLine={false} axisLine={false} unit="s" />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<TipBox unit=" WPM" labelPrefix="at " />} cursor={{ stroke: 'var(--muted)', strokeDasharray: 4 }} />
          <Area type="monotone" dataKey="wpm" stroke="var(--accent)" strokeWidth={2.5} fill="url(#wpmFill)" isAnimationActive animationDuration={900} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface TrendPoint {
  label: string;
  value: number;
  avg?: number;
}

/** A small trend line: WPM or accuracy over time. */
export function TrendChart({
  data, color = 'var(--accent)', unit = '', height = 200, domain, ariaLabel, showAvg = false,
}: { data: TrendPoint[]; color?: string; unit?: string; height?: number; domain?: [number | 'auto', number | 'auto']; ariaLabel: string; showAvg?: boolean }) {
  if (data.length < 2) {
    return <div className="grid place-items-center text-sm text-muted" style={{ height }}>Complete a couple of sessions to see a trend.</div>;
  }
  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={tick} tickLine={false} axisLine={false} width={40} domain={domain ?? ['auto', 'auto']} />
          <Tooltip content={<TipBox unit={unit} />} cursor={{ stroke: 'var(--muted)', strokeDasharray: 4 }} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color, strokeWidth: 0 }} activeDot={{ r: 5 }} isAnimationActive animationDuration={700} />
          {showAvg && <Line type="monotone" dataKey="avg" stroke="var(--accent-2)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
