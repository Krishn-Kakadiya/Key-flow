import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BookOpen, CalendarCheck, Check, GraduationCap, Snowflake, Sparkles, Timer, Type, Flower2, Quote,
} from 'lucide-react';
import { useStore, spendableXp } from '../store';
import { useToday } from '../lib/hooks';
import { effectiveStreak, levelProgress, practisedToday } from '../lib/progress';
import { FREEZE_COST, MAX_FREEZES } from '../store/defaults';
import { StreakFlame } from '../components/StreakFlame';
import { ProgressRing } from '../components/ui';
import { TrendChart } from '../components/LazyCharts';
import { challengeFor } from '../lib/challenge';
import { STORIES } from '../data/stories';
import { LESSONS } from '../data/lessons';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Burning the midnight oil';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const QUICK = [
  { label: '15s sprint', to: '/practice?mode=time&value=15', icon: Timer },
  { label: '30 seconds', to: '/practice?mode=time&value=30', icon: Timer },
  { label: '60 seconds', to: '/practice?mode=time&value=60', icon: Timer },
  { label: '25 words', to: '/practice?mode=words&value=25', icon: Type },
  { label: 'Quote', to: '/practice?mode=quote&value=short', icon: Quote },
  { label: 'Zen', to: '/practice?mode=zen', icon: Flower2 },
];

export function HomePage() {
  const today = useToday();
  const streak = useStore((s) => s.streak);
  const profile = useStore((s) => s.profile);
  const sessions = useStore((s) => s.sessions);
  const minutes = useStore((s) => s.minutesByDate[today] ?? 0);
  const challenges = useStore((s) => s.challenges);
  const stories = useStore((s) => s.stories);
  const lessons = useStore((s) => s.lessons);
  const settings = useStore((s) => s.settings);
  const records = useStore((s) => s.records);
  const buyFreeze = useStore((s) => s.buyFreeze);

  const shown = effectiveStreak(streak, today, profile.streakFreezes);
  const doneToday = practisedToday(streak, today);
  const wasBroken = streak.current > 0 && shown === 0;
  const lvl = levelProgress(profile.xp);
  const goalPct = Math.min(1, minutes / profile.dailyGoalMinutes);
  const challenge = challengeFor(today);
  const cRec = challenges[today];

  const cont = useMemo(() => {
    const started = STORIES.map((s) => ({ s, p: stories[s.id] }))
      .filter((x) => x.p && x.p.completedAt === null)
      .sort((a, b) => b.p!.lastPlayed - a.p!.lastPlayed)[0];
    if (started) {
      const next = Math.min(started.s.chapters.length - 1, Math.max(-1, ...started.p!.completedChapters) + 1);
      return { story: started.s, chapter: next, fresh: false };
    }
    const unread = STORIES.find((s) => !stories[s.id]);
    return unread ? { story: unread, chapter: 0, fresh: true } : null;
  }, [stories]);

  const nextLesson = useMemo(() => {
    for (const l of LESSONS) if (!lessons[l.id]?.passed) return l;
    return null;
  }, [lessons]);

  const trend = useMemo(
    () => sessions.slice(-14).map((s, i) => ({ label: new Date(s.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + (i < 0 ? '' : ''), value: s.netWpm })),
    [sessions],
  );
  const best = Math.max(0, ...Object.entries(records.bestWpmByMode).filter(([k]) => k.startsWith('time-') || k.startsWith('words-')).map(([, v]) => v));
  const canBuy = profile.streakFreezes < MAX_FREEZES && spendableXp({ profile }) >= FREEZE_COST;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{greeting()}.</h1>
        <p className="mt-1 text-sm text-muted">
          {wasBroken
            ? "Welcome back! Let's rebuild your streak — one quick session starts it again."
            : sessions.length === 0
              ? 'Ready for your first session? Pick anything below.'
              : doneToday
                ? "You've already practised today. Nice — anything else is a bonus."
                : 'A few minutes today keeps the flame alive.'}
        </p>
      </div>

      {/* streak nudge */}
      {shown > 0 && !doneToday && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card flex flex-wrap items-center justify-between gap-3 border-caret/40 p-4">
          <div className="flex items-center gap-3 text-sm">
            <StreakFlame streak={shown} size={26} />
            <span><strong>Keep your {shown}-day streak</strong> — one quick session left today.</span>
          </div>
          <Link to="/practice?mode=time&value=30" className="btn btn-primary !py-2">30-second run <ArrowRight size={16} /></Link>
        </motion.div>
      )}

      <div className="grid gap-5 md:grid-cols-3">
        {/* streak */}
        <div className="card flex items-center gap-4 p-5">
          <StreakFlame streak={shown} size={74} />
          <div className="min-w-0">
            <div className="label">Streak</div>
            <div className="text-4xl font-extrabold tabular">{shown}<span className="ml-1 text-base font-semibold text-muted">day{shown === 1 ? '' : 's'}</span></div>
            <div className="text-xs text-muted">Longest: {Math.max(streak.longest, shown)}</div>
            <div className="mt-2 flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-accent"><Snowflake size={13} /> {profile.streakFreezes}/{MAX_FREEZES}</span>
              <button className="chip !px-2 !py-0.5 !text-xs" disabled={!canBuy} onClick={() => buyFreeze()} title={`Spend ${FREEZE_COST} XP to protect one missed day`}>
                Buy freeze · {FREEZE_COST} XP
              </button>
            </div>
          </div>
        </div>

        {/* daily goal */}
        <div className="card flex items-center gap-4 p-5">
          <ProgressRing pct={goalPct} size={92} color={goalPct >= 1 ? 'var(--success)' : 'var(--accent)'} label={`Daily goal ${Math.round(goalPct * 100)} percent`}>
            {goalPct >= 1 ? <Check className="text-success" size={30} /> : <span className="text-lg font-bold tabular">{Math.round(goalPct * 100)}%</span>}
          </ProgressRing>
          <div>
            <div className="label">Daily goal</div>
            <div className="text-2xl font-bold tabular">{minutes.toFixed(1)}<span className="text-base font-semibold text-muted"> / {profile.dailyGoalMinutes} min</span></div>
            <div className="text-xs text-muted">{goalPct >= 1 ? 'Goal reached!' : `${Math.max(0, profile.dailyGoalMinutes - minutes).toFixed(1)} min to go`}</div>
          </div>
        </div>

        {/* level */}
        <Link to="/stats" className="card block p-5 transition hover:bg-surface2">
          <div className="label">Level</div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tabular text-accent2">{lvl.level}</span>
            <span className="text-sm text-muted tabular">{lvl.into} / {lvl.needed} XP</span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface2">
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--accent-2), var(--accent))' }} initial={{ width: 0 }} animate={{ width: `${lvl.pct * 100}%` }} transition={{ duration: 0.9 }} />
          </div>
          <div className="mt-2 text-xs text-muted">{spendableXp({ profile })} XP to spend on streak freezes</div>
        </Link>
      </div>

      {/* daily challenge */}
      <Link to="/challenge" className="card flex flex-wrap items-center justify-between gap-4 p-5 transition hover:bg-surface2">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent"><CalendarCheck size={28} /></div>
          <div>
            <div className="label">Today's challenge {cRec?.completed && <span className="ml-1 text-success">· Completed ✓</span>}</div>
            <div className="text-lg font-bold">{challenge.title}</div>
            <div className="text-sm text-muted">{challenge.goal}</div>
          </div>
        </div>
        <span className="btn btn-primary">{cRec?.completed ? 'Play again' : 'Start challenge'} <ArrowRight size={16} /></span>
      </Link>

      <div className="grid gap-5 md:grid-cols-2">
        {cont && (
          <Link to={`/stories/${cont.story.id}/${cont.chapter}`} className="card group flex items-center gap-4 p-5 transition hover:bg-surface2">
            <div className="grid h-16 w-12 shrink-0 place-items-center rounded-lg text-2xl shadow-lg" style={{ background: `linear-gradient(160deg, ${cont.story.colors[0]}, ${cont.story.colors[1]})` }}>{cont.story.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="label flex items-center gap-1"><BookOpen size={13} /> {cont.fresh ? 'Start a story' : 'Continue reading'}</div>
              <div className="truncate font-bold">{cont.story.title}</div>
              <div className="truncate text-sm text-muted">Chapter {cont.chapter + 1}: {cont.story.chapters[cont.chapter].title}</div>
            </div>
            <ArrowRight className="text-muted transition group-hover:translate-x-1" size={18} />
          </Link>
        )}
        {nextLesson ? (
          <Link to={`/lessons/${nextLesson.id}`} className="card group flex items-center gap-4 p-5 transition hover:bg-surface2">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent2/15 text-accent2"><GraduationCap size={26} /></div>
            <div className="min-w-0 flex-1">
              <div className="label">Next lesson</div>
              <div className="truncate font-bold">{nextLesson.title}</div>
              <div className="truncate text-sm text-muted">{nextLesson.section} · {nextLesson.description}</div>
            </div>
            <ArrowRight className="text-muted transition group-hover:translate-x-1" size={18} />
          </Link>
        ) : (
          <div className="card flex items-center gap-3 p-5 text-sm text-muted"><Sparkles className="text-caret" /> You've finished every lesson. Touch typist!</div>
        )}
      </div>

      {/* quick start */}
      <div>
        <div className="label mb-2">Quick start</div>
        <div className="flex flex-wrap gap-2">
          {QUICK.map(({ label, to, icon: Icon }) => (
            <Link key={label} to={to} className="btn btn-ghost"><Icon size={16} /> {label}</Link>
          ))}
        </div>
      </div>

      {/* trend */}
      <div className="card p-5">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <div className="label">Recent speed</div>
            <div className="text-sm text-muted">
              {profile.baselineWpm ? <>Started at <strong className="text-fg">{Math.round(profile.baselineWpm)}</strong> WPM · </> : null}
              {best > 0 ? <>best <strong className="text-fg">{Math.round(best)}</strong> WPM</> : 'no records yet'}
            </div>
          </div>
          <Link to="/stats" className="text-sm font-medium text-accent hover:underline">All stats →</Link>
        </div>
        <TrendChart data={trend} unit=" WPM" height={160} ariaLabel="Net WPM for your most recent sessions" />
      </div>

      {settings.sound === false && sessions.length < 3 && (
        <p className="text-center text-xs text-muted">Tip: turn on mechanical keyboard sounds in <Link className="text-accent underline" to="/settings">Settings</Link>.</p>
      )}
    </div>
  );
}
