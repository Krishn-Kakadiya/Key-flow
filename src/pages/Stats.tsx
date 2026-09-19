import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Crosshair, Gauge, Hash, History, Layers, Trophy } from 'lucide-react';
import { useStore } from '../store';
import { PageHeader, Segmented, StatCard } from '../components/ui';
import { TrendChart } from '../components/LazyCharts';
import { KeyboardVisual } from '../components/KeyboardVisual';
import { BadgeGrid } from '../components/BadgeGrid';
import { rankWeakKeys } from '../lib/text';
import { physicalKey } from '../lib/fingers';
import { levelProgress } from '../lib/progress';
import { BADGES } from '../lib/badges';
import { STORIES } from '../data/stories';
import { LESSONS } from '../data/lessons';

type Range = '7' | '30' | 'all';

function prettyMode(key: string): string | null {
  const [base, ...rest] = key.split('+');
  const opts = rest.length ? ` (${rest.join(', ')})` : '';
  const m = base.match(/^(time|words|quote|code|challenge)-(.+)$/);
  if (!m) return base === 'weak-drill' ? 'Weak-key drill' : null;
  const [, kind, val] = m;
  switch (kind) {
    case 'time': return `${val} seconds${opts}`;
    case 'words': return `${val} words${opts}`;
    case 'quote': return `${val[0].toUpperCase()}${val.slice(1)} quote`;
    case 'code': return `Code · ${val}`;
    default: return `Challenge · ${val}`;
  }
}

function fmtDuration(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function StatsPage() {
  const sessions = useStore((s) => s.sessions);
  const totals = useStore((s) => s.totals);
  const records = useStore((s) => s.records);
  const badges = useStore((s) => s.badges);
  const profile = useStore((s) => s.profile);
  const stories = useStore((s) => s.stories);
  const lessons = useStore((s) => s.lessons);
  const [range, setRange] = useState<Range>('30');
  const [metric, setMetric] = useState<'errors' | 'speed'>('errors');

  const filtered = useMemo(() => {
    if (range === 'all') return sessions;
    const cutoff = Date.now() - Number(range) * 86_400_000;
    return sessions.filter((s) => s.timestamp >= cutoff);
  }, [sessions, range]);

  /** Few sessions: one point each. Many: one point per day (average) so long ranges stay readable. */
  const daily = useMemo(() => {
    if (filtered.length <= 30) {
      return filtered.map((s) => ({
        label: new Date(s.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
        wpm: s.netWpm,
        acc: s.accuracy,
      }));
    }
    const byDay = new Map<string, { t: number; wpm: number[]; acc: number[] }>();
    for (const s of filtered) {
      const d = new Date(s.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const e = byDay.get(key) ?? { t: s.timestamp, wpm: [], acc: [] };
      e.wpm.push(s.netWpm);
      e.acc.push(s.accuracy);
      byDay.set(key, e);
    }
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
    return [...byDay.values()].sort((a, b) => a.t - b.t).map((e) => ({
      label: new Date(e.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      wpm: Math.round(avg(e.wpm) * 10) / 10,
      acc: Math.round(avg(e.acc) * 10) / 10,
    }));
  }, [filtered]);

  const last = sessions[sessions.length - 1];
  const avgWpm = filtered.length ? filtered.reduce((a, s) => a + s.netWpm, 0) / filtered.length : 0;
  const speedRecords = Object.entries(records.bestWpmByMode).filter(([k]) => /^(time|words)-/.test(k));
  const best = speedRecords.reduce((a, [, v]) => Math.max(a, v), 0);
  const lvl = levelProgress(profile.xp);
  const words = Math.floor(totals.correctChars / 5);

  const recordRows = Object.entries(records.bestWpmByMode)
    .map(([k, v]) => ({ key: k, name: prettyMode(k), wpm: v }))
    .filter((r): r is { key: string; name: string; wpm: number } => !!r.name)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  /* heatmap: aggregate per physical key */
  const { heat, weak, hasData } = useMemo(() => {
    const agg: Record<string, { hits: number; errors: number; ms: number }> = {};
    for (const [ch, st] of Object.entries(totals.keyStats)) {
      const k = physicalKey(ch);
      const a = (agg[k] ??= { hits: 0, errors: 0, ms: 0 });
      a.hits += st.hits;
      a.errors += st.errors;
      a.ms += st.ms;
    }
    const usable = Object.entries(agg).filter(([, a]) => a.hits >= 5);
    const speeds = usable.map(([, a]) => a.ms / Math.max(1, a.hits - a.errors)).filter((v) => v > 0);
    const lo = Math.min(...speeds);
    const hi = Math.max(...speeds);
    const heat: Record<string, number> = {};
    for (const [k, a] of usable) {
      if (metric === 'errors') heat[k] = Math.min(1, a.errors / a.hits / 0.2);
      else {
        const v = a.ms / Math.max(1, a.hits - a.errors);
        heat[k] = hi > lo ? (v - lo) / (hi - lo) : 0;
      }
    }
    return { heat, weak: rankWeakKeys(totals.keyStats).slice(0, 5), hasData: usable.length > 0 };
  }, [totals.keyStats, metric]);

  const empty = sessions.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Stats" subtitle="Your progress at a glance. Everything is calculated on this device." />

      {empty && (
        <div className="card p-8 text-center">
          <div className="text-lg font-bold">Nothing to show yet</div>
          <p className="mt-1 text-sm text-muted">Complete your first session and your charts will appear here.</p>
          <Link to="/practice" className="btn btn-primary mt-4">Start typing</Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <StatCard label="Best WPM" value={best ? Math.round(best) : '–'} sub="time & word modes" />
        <StatCard label="Average" value={avgWpm ? Math.round(avgWpm) : '–'} sub={range === 'all' ? 'all sessions' : `last ${range} days`} />
        <StatCard label="Last" value={last ? Math.round(last.netWpm) : '–'} sub={last ? `${Math.round(last.accuracy)}% accuracy` : undefined} />
        <StatCard label="Time typed" value={<span className="text-2xl">{fmtDuration(totals.seconds)}</span>} sub="active typing time" />
        <StatCard label="Words typed" value={words.toLocaleString()} sub="correct words" />
        <StatCard label="Sessions" value={totals.sessions.toLocaleString()} sub={`${totals.perfectRuns} perfect`} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="label">Trends</div>
        <Segmented label="Range" value={range} onChange={setRange} options={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: 'all', label: 'All time' }]} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <div className="label mb-2 flex items-center gap-1.5"><Gauge size={14} /> WPM over time</div>
          <TrendChart data={daily.map((d) => ({ label: d.label, value: d.wpm }))} unit=" WPM" ariaLabel="Average words per minute per day" />
        </div>
        <div className="card p-5">
          <div className="label mb-2 flex items-center gap-1.5"><Crosshair size={14} /> Accuracy</div>
          <TrendChart data={daily.map((d) => ({ label: d.label, value: d.acc }))} unit="%" color="var(--accent-2)" domain={[Math.max(0, Math.floor(Math.min(100, ...daily.map((d) => d.acc)) - 5)), 100]} ariaLabel="Average accuracy percentage per day" />
        </div>
      </div>

      {/* records + level */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="label mb-3 flex items-center gap-1.5"><Trophy size={14} /> Personal records</div>
          {recordRows.length === 0 ? (
            <p className="text-sm text-muted">Set a record in any practice mode and it will be listed here.</p>
          ) : (
            <table className="w-full text-sm">
              <caption className="sr-only">Best WPM by mode</caption>
              <thead><tr className="text-left text-xs text-muted"><th className="pb-2 font-medium">Mode</th><th className="pb-2 text-right font-medium">Best WPM</th></tr></thead>
              <tbody>
                {recordRows.map((r) => (
                  <tr key={r.key} className="border-t border-line"><td className="py-2">{r.name}</td><td className="py-2 text-right font-semibold tabular text-accent">{Math.round(r.wpm)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card p-5">
          <div className="label mb-3 flex items-center gap-1.5"><Layers size={14} /> Progress</div>
          <div className="flex items-baseline gap-2"><span className="text-4xl font-extrabold tabular text-accent2">{lvl.level}</span><span className="text-sm text-muted">level</span></div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface2"><div className="h-full rounded-full bg-accent2" style={{ width: `${lvl.pct * 100}%` }} /></div>
          <div className="mt-1 text-xs text-muted tabular">{lvl.into} / {lvl.needed} XP · {profile.xp.toLocaleString()} total</div>
          <dl className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Lessons passed</dt><dd className="font-semibold tabular">{Object.values(lessons).filter((l) => l.passed).length} / {LESSONS.length}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Books finished</dt><dd className="font-semibold tabular">{Object.values(stories).filter((s) => s.completedAt).length} / {STORIES.length}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Badges</dt><dd className="font-semibold tabular">{Object.keys(badges).length} / {BADGES.length}</dd></div>
            {profile.baselineWpm ? <div className="flex justify-between"><dt className="text-muted">Starting speed</dt><dd className="font-semibold tabular">{Math.round(profile.baselineWpm)} WPM</dd></div> : null}
          </dl>
        </div>
      </div>

      {/* heatmap */}
      <div className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="label flex items-center gap-1.5"><Hash size={14} /> Keyboard heatmap</div>
          <Segmented label="Heatmap metric" value={metric} onChange={setMetric} options={[{ value: 'errors', label: 'Mistakes' }, { value: 'speed', label: 'Speed' }]} />
        </div>
        {hasData ? (
          <>
            <KeyboardVisual heat={heat} heatMode={metric} compact />
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
              <span>{metric === 'errors' ? 'Fewer mistakes' : 'Faster'}</span>
              <span className="h-2.5 w-40 rounded-full" style={{ background: 'linear-gradient(90deg, var(--success), var(--error))' }} />
              <span>{metric === 'errors' ? 'More mistakes' : 'Slower'}</span>
            </div>
            {weak.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface2 p-4">
                <div className="text-sm">
                  <div className="font-semibold">Your trickiest keys</div>
                  <div className="mt-1 flex gap-1.5">{weak.map((w) => <kbd key={w.key} className="grid h-8 min-w-8 place-items-center rounded-md border border-line bg-surface font-mono text-sm font-bold uppercase">{w.key}</kbd>)}</div>
                </div>
                <Link to="/practice?mode=weak" className="btn btn-primary"><Crosshair size={16} /> Drill weak keys</Link>
              </div>
            )}
          </>
        ) : (
          <p className="py-6 text-center text-sm text-muted">Type a few sessions and Keyflow will map which keys you're fast or error-prone on.</p>
        )}
      </div>

      {/* history */}
      {sessions.length > 0 && (
        <div className="card p-5">
          <div className="label mb-3 flex items-center gap-1.5"><History size={14} /> Recent sessions</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Most recent sessions</caption>
              <thead><tr className="text-left text-xs text-muted"><th className="pb-2 font-medium">When</th><th className="pb-2 font-medium">Mode</th><th className="pb-2 text-right font-medium">WPM</th><th className="pb-2 text-right font-medium">Acc</th><th className="hidden pb-2 text-right font-medium sm:table-cell"><Clock size={12} className="ml-auto" /></th></tr></thead>
              <tbody>
                {sessions.slice(-10).reverse().map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="py-2 text-muted">{new Date(s.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td>
                    <td className="py-2">{prettyMode(s.modeKey) ?? s.mode}</td>
                    <td className="py-2 text-right font-semibold tabular">{Math.round(s.netWpm)}</td>
                    <td className="py-2 text-right tabular">{Math.round(s.accuracy)}%</td>
                    <td className="hidden py-2 text-right tabular text-muted sm:table-cell">{Math.round(s.durationSec)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <div className="label mb-3">Badges</div>
        <BadgeGrid unlocked={badges} />
      </div>
    </div>
  );
}
