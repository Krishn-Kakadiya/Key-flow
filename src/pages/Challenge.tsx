import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Crosshair, Flame, Play, Snowflake, Sparkles, Target, Timer, Trophy, X, Zap } from 'lucide-react';
import { useStore } from '../store';
import { useCountdownToMidnight, useToday } from '../lib/hooks';
import { challengeFor, challengeSpec, type ChallengeDef } from '../lib/challenge';
import { addDays, MONTH_NAMES, parseDateStr, toDateStr } from '../lib/date';
import { effectiveStreak, typistPercentile } from '../lib/progress';
import { PageHeader } from '../components/ui';
import { SessionRunner } from '../components/SessionRunner';
import { StreakFlame } from '../components/StreakFlame';

const ICONS = { zap: Zap, target: Target, timer: Timer, crosshair: Crosshair, sparkles: Sparkles } as const;

function Calendar() {
  const today = useToday();
  const challenges = useStore((s) => s.challenges);
  const streak = useStore((s) => s.streak);
  const [cursor, setCursor] = useState(() => {
    const d = parseDateStr(toDateStr());
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const first = new Date(cursor.y, cursor.m, 1);
  const days = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // Monday first
  const cells: (string | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => toDateStr(new Date(cursor.y, cursor.m, i + 1))),
  ];
  const prefix = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`;
  const completed = Object.values(challenges).filter((c) => c.completed && c.date.startsWith(prefix)).length;
  const practised = streak.history.filter((d) => d.startsWith(prefix)).length;
  const move = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{MONTH_NAMES[cursor.m]} {cursor.y}</h2>
        <div className="flex gap-1">
          <button className="chip !px-2" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <button className="chip !px-2" onClick={() => move(1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted" aria-hidden="true">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d}>{d}</div>)}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5" role="grid" aria-label={`Challenge calendar for ${MONTH_NAMES[cursor.m]} ${cursor.y}`}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const c = challenges[d];
          const isToday = d === today;
          const future = d > today;
          const did = streak.history.includes(d);
          const frozen = streak.frozen.includes(d);
          const dayNum = Number(d.slice(8));
          const label = `${d}${c?.completed ? ', challenge completed' : did ? ', practised' : frozen ? ', covered by a streak freeze' : ''}`;
          return (
            <div
              key={d} role="gridcell" aria-label={label} title={label}
              className={`relative grid aspect-[5/4] place-items-center rounded-xl text-sm tabular sm:aspect-[7/4] ${future ? 'text-untyped' : 'text-fg'} ${c?.completed ? 'bg-accent text-onaccent font-bold' : did ? 'bg-accent/15' : frozen ? 'bg-surface2' : 'bg-surface2/50'} ${isToday ? 'ring-2 ring-caret' : ''}`}
            >
              {c?.completed ? <Check size={18} strokeWidth={3} /> : frozen ? <Snowflake size={15} className="text-accent" /> : dayNum}
              {c?.completed && <span className="absolute bottom-0.5 right-1.5 text-[9px] opacity-80">{dayNum}</span>}
              {!c?.completed && did && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
        <span><strong className="text-fg">{completed}</strong> challenges completed</span>
        <span><strong className="text-fg">{practised}</strong> days practised</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-accent" /> challenge</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-accent/15" /> practised</span>
      </div>
    </div>
  );
}

function TodayCard({ def, onStart }: { def: ChallengeDef; onStart: () => void }) {
  const rec = useStore((s) => s.challenges[def.date]);
  const left = useCountdownToMidnight();
  const Icon = ICONS[def.icon];
  return (
    <div className="card relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-accent/10 blur-2xl" />
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-accent/15 text-accent"><Icon size={32} /></div>
          <div>
            <div className="label">Today's challenge</div>
            <h2 className="text-2xl font-extrabold tracking-tight">{def.title}</h2>
            <p className="text-sm text-muted">{def.description}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-medium"><Target size={14} className="text-accent" /> Goal: {def.goal}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {rec?.completed ? (
            <div className="flex items-center gap-1.5 rounded-lg bg-success/15 px-3 py-1.5 text-sm font-semibold text-success"><Check size={16} /> Completed</div>
          ) : rec ? (
            <div className="text-xs text-muted">{rec.attempts} attempt{rec.attempts === 1 ? '' : 's'} · best {Math.round(rec.bestAccuracy)}% accuracy</div>
          ) : null}
          <button className="btn btn-primary !px-6 !py-3 !text-base" onClick={onStart} autoFocus>
            <Play size={18} /> {rec?.completed ? 'Play again' : 'Start challenge'}
          </button>
          <div className="text-xs text-muted">New challenge in {left}</div>
        </div>
      </div>
    </div>
  );
}

export function ChallengePage() {
  const today = useToday();
  const def = useMemo(() => challengeFor(today), [today]);
  const keyStats = useStore((s) => s.totals.keyStats);
  const streak = useStore((s) => s.streak);
  const freezes = useStore((s) => s.profile.streakFreezes);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState(0);

  const spec = useMemo(() => {
    if (!playing) return null;
    const c = challengeSpec(def, keyStats);
    return {
      ...c,
      countdown: true,
      mode: 'challenge' as const,
      modeKey: `challenge-${def.type}`,
      keepGhost: def.type === 'sprint',
      ref: { type: 'challenge' as const, date: def.date, ctype: def.type },
      label: `Daily challenge · ${def.title}`,
    };
    // keyStats intentionally read once when the challenge starts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, def, run]);

  const shown = effectiveStreak(streak, today, freezes);

  if (playing && spec) {
    return (
      <div>
        <div className="chrome mb-5 flex items-center justify-between">
          <button className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg" onClick={() => setPlaying(false)}><ArrowLeft size={16} /> Challenge home</button>
          <div className="text-sm font-semibold">{def.title}</div>
        </div>
        <SessionRunner
          key={run}
          spec={spec}
          onRestart={() => setRun((r) => r + 1)}
          onQuit={() => setPlaying(false)}
          hint={<span>{spec.note ?? `Goal: ${def.goal}`}</span>}
          renderNotice={({ result, reward }) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className={`card flex items-center gap-3 p-5 ${reward.challengeGoalMet ? 'border-success/50' : 'border-caret/50'}`}>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${reward.challengeGoalMet ? 'bg-success/20 text-success' : 'bg-caret/20 text-caret'}`}>
                  {reward.challengeGoalMet ? <Trophy size={22} /> : <X size={22} />}
                </span>
                <div>
                  <div className="text-lg font-bold">{reward.challengeGoalMet ? (reward.challengeCompleted ? 'Challenge complete!' : 'Goal met again!') : 'Goal not reached'}</div>
                  <div className="text-sm text-muted">{reward.challengeGoalMet ? (reward.challengeCompleted ? 'Bonus XP earned and today is marked on your calendar.' : "You've already banked today's bonus — nice consistency.") : `${def.goal}. You can retry as many times as you like.`}</div>
                </div>
              </div>
              <div className="card p-5">
                <div className="label">How you compare</div>
                <div className="mt-1 text-lg font-bold">Faster than {typistPercentile(result.netWpm)}% of typical typists</div>
                <div className="text-xs text-muted">Compared with published average typing speeds — Keyflow doesn't collect anyone's scores.</div>
              </div>
            </div>
          )}
          renderActions={({ reward }) => (
            <>
              <button className="btn btn-ghost" onClick={() => setRun((r) => r + 1)}>{reward.challengeGoalMet ? 'Play again' : 'Try again'}</button>
              <button className="btn btn-primary" onClick={() => setPlaying(false)} autoFocus>Done <ArrowRight size={16} /></button>
            </>
          )}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Daily challenge" subtitle="A fresh challenge every day. It resets at your local midnight." />
      <div className="space-y-5">
        <TodayCard def={def} onStart={() => { setRun((r) => r + 1); setPlaying(true); }} />
        <div className="grid gap-5 md:grid-cols-3">
          <div className="card flex items-center gap-4 p-5 md:col-span-1">
            <StreakFlame streak={shown} size={56} />
            <div>
              <div className="label">Current streak</div>
              <div className="text-3xl font-extrabold tabular">{shown}</div>
              <div className="text-xs text-muted">Longest: {Math.max(streak.longest, shown)} · <Snowflake size={11} className="inline" /> {freezes} freeze{freezes === 1 ? '' : 's'}</div>
            </div>
          </div>
          <div className="card p-5 md:col-span-2">
            <div className="label mb-2 flex items-center gap-1.5"><Flame size={14} /> Coming up</div>
            <ul className="grid gap-2 sm:grid-cols-3">
              {[1, 2, 3].map((n) => {
                const d = challengeFor(addDays(today, n));
                const I = ICONS[d.icon];
                return (
                  <li key={n} className="flex items-center gap-2 rounded-xl bg-surface2 p-3 text-sm">
                    <I size={18} className="shrink-0 text-accent" />
                    <div className="min-w-0"><div className="truncate font-semibold">{d.title}</div><div className="text-xs text-muted">{n === 1 ? 'Tomorrow' : `In ${n} days`}</div></div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <Calendar />
        <p className="text-center text-xs text-muted">Any session — not just the challenge — keeps your streak alive. <Link to="/practice" className="text-accent underline">Start a practice run</Link></p>
      </div>
    </div>
  );
}
