import { useEffect, useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Award, Flame, Snowflake, Sparkles, Star, Target, Trophy } from 'lucide-react';
import type { EngineResult } from '../lib/engine';
import type { Reward } from '../types';
import { CountUp, ProgressRing, StatCard } from './ui';
import { WpmChart } from './LazyCharts';
import { StreakFlame } from './StreakFlame';
import { BadgeChip } from './BadgeGrid';
import { ShareCard } from './ShareCard';
import { celebrate } from '../lib/celebrate';
import { playLevelUp, playPB, playChime } from '../lib/audio';
import { useReducedMotion } from '../lib/hooks';
import { useStore } from '../store';
import { useUi } from '../store/ui';
import { levelProgress } from '../lib/progress';
import { themeById } from '../lib/themes';
import { physicalKey } from '../lib/fingers';

interface Props {
  result: EngineResult;
  reward: Reward;
  label: string;
  actions: ReactNode;
  notice?: ReactNode;
  /** hide the streak/XP panels (e.g. onboarding baseline shows its own) */
  compact?: boolean;
}

function headline(result: EngineResult, reward: Reward, recentAvg: number | null): { title: string; sub: string } {
  if (!reward.counted) return { title: 'Good start', sub: 'Type at least 15 correct characters for a session to count toward your streak and stats.' };
  if (reward.isFirstRecord) return { title: 'Record set!', sub: 'That is your first score for this mode — now you have a number to beat.' };
  if (reward.isPB) return { title: 'New personal best!', sub: `Up ${Math.round((result.netWpm - reward.previousBest) * 10) / 10} WPM from your previous record.` };
  if (result.accuracy === 100) return { title: 'Flawless.', sub: 'Not a single mistake. That is real control.' };
  if (recentAvg !== null && result.netWpm >= recentAvg + 3) return { title: 'Above your usual pace', sub: `${Math.round(result.netWpm - recentAvg)} WPM faster than your recent average.` };
  if (result.accuracy >= 97) return { title: 'Clean and controlled', sub: 'Accuracy this high means speed is coming.' };
  if (recentAvg !== null && result.netWpm >= recentAvg - 2) return { title: 'Right on your pace', sub: 'Steady practice is how the numbers move.' };
  return { title: 'Session banked', sub: 'Every run trains your fingers. Come back tomorrow and keep the chain going.' };
}

export function ResultsView({ result, reward, label, actions, notice, compact }: Props) {
  const reduced = useReducedMotion();
  const sessions = useStore((s) => s.sessions);
  const profile = useStore((s) => s.profile);
  const streakFreezes = profile.streakFreezes;
  const showLevelUp = useUi((s) => s.showLevelUp);

  const recentAvg = useMemo(() => {
    const prev = sessions.slice(0, -1).slice(-8);
    return prev.length >= 3 ? prev.reduce((a, s) => a + s.netWpm, 0) / prev.length : null;
  }, [sessions]);
  const { title, sub } = headline(result, reward, recentAvg);

  /* celebrations, after the numbers have counted up */
  useEffect(() => {
    if (!reward.counted) return;
    const timers: number[] = [];
    if (reward.isPB) {
      timers.push(window.setTimeout(() => { celebrate('pb', reduced); playPB(); }, 900));
    } else if (reward.streakMilestone || reward.bookCompleted) {
      timers.push(window.setTimeout(() => { celebrate(reward.streakMilestone ? 'streak' : 'book', reduced); playChime(); }, 900));
    } else if (reward.lessonPassed && reward.lessonStars === 3) {
      timers.push(window.setTimeout(() => { celebrate('small', reduced); playChime(); }, 900));
    }
    if (reward.levelAfter > reward.levelBefore) {
      timers.push(window.setTimeout(() => { playLevelUp(); showLevelUp(reward.levelAfter, reward.newThemes); }, reward.isPB ? 2600 : 1700));
    }
    return () => timers.forEach(window.clearTimeout);
    // run once per result
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const missed = useMemo(() => {
    const merged: Record<string, number> = {};
    for (const [k, n] of Object.entries(result.keyErrors)) {
      const key = k === ' ' ? 'space' : k;
      merged[key] = (merged[key] ?? 0) + n;
    }
    return Object.entries(merged).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [result.keyErrors]);
  const maxMiss = missed[0]?.[1] ?? 1;

  const lvl = levelProgress(reward.xpAfter);
  const lvlBefore = levelProgress(reward.xpBefore);
  const startPct = reward.levelAfter > reward.levelBefore ? 0 : lvlBefore.pct;
  const goal = profile.dailyGoalMinutes;
  const goalPct = Math.min(1, reward.dailyMinutes / goal);
  const dur = result.durationSec;

  return (
    <div className="space-y-5">
      {/* headline */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="label">{label}</div>
        <h2 className="mt-1 flex items-center justify-center gap-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {reward.isPB && <Trophy className="text-caret" size={30} />}
          {title}
        </h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-muted">{sub}</p>
      </motion.div>

      {/* big numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard big label="WPM" value={<CountUp value={result.netWpm} decimals={0} />} sub={`raw ${Math.round(result.rawWpm)} · net of errors`} className="[&_.text-5xl]:text-accent" />
        <StatCard big label="Accuracy" value={<CountUp value={result.accuracy} decimals={result.accuracy % 1 ? 1 : 0} suffix="%" delay={0.1} />} sub={`${result.errors} mistake${result.errors === 1 ? '' : 's'}`} />
        <StatCard big label="Time" value={dur >= 60 ? <><CountUp value={Math.floor(dur / 60)} delay={0.2} />m {Math.round(dur % 60)}s</> : <CountUp value={dur} decimals={dur % 1 ? 1 : 0} suffix="s" delay={0.2} />} sub={`${result.charsTyped} characters`} />
        <StatCard big label="Consistency" value={<CountUp value={result.consistency} suffix="%" delay={0.3} />} sub={`best combo x${result.maxCombo}`} />
      </div>

      {notice}

      {/* graph + errors */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="label mb-2">Speed over time</div>
          <WpmChart series={result.wpmSeries} step={result.seriesStep} />
        </div>
        <div className="card p-5">
          <div className="label mb-3 flex items-center gap-1.5"><Target size={14} /> Most-missed keys</div>
          {missed.length === 0 ? (
            <p className="text-sm text-muted">No missed keys — a perfect sheet.</p>
          ) : (
            <ul className="space-y-2" aria-label="Most missed keys">
              {missed.map(([k, n]) => (
                <li key={k} className="flex items-center gap-3 text-sm">
                  <kbd className="grid h-7 min-w-7 place-items-center rounded-md border border-line bg-surface2 px-1.5 font-mono text-xs">{k.length === 1 ? physicalKey(k) : k}</kbd>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface2">
                    <motion.div className="h-full rounded-full bg-err" initial={{ width: 0 }} animate={{ width: `${(n / maxMiss) * 100}%` }} transition={{ duration: 0.7, delay: 0.3 }} />
                  </div>
                  <span className="w-6 text-right tabular text-muted">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* rewards */}
      {reward.counted && !compact && (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="card p-5">
            <div className="label mb-3 flex items-center gap-1.5"><Sparkles size={14} /> XP earned</div>
            <ul className="space-y-1.5 text-sm">
              {reward.xpLines.map((l) => (
                <li key={l.label} className="flex justify-between"><span className="text-muted">{l.label}</span><span className="tabular font-semibold text-accent2">+{l.xp}</span></li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-line pt-3 text-base font-bold">
              <span>Total</span><span className="tabular text-accent2">+<CountUp value={reward.xp} duration={0.8} delay={0.4} /> XP</span>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted"><span>Level {lvl.level}</span><span className="tabular">{lvl.into} / {lvl.needed}</span></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface2">
                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--accent-2), var(--accent))' }} initial={{ width: `${startPct * 100}%` }} animate={{ width: `${lvl.pct * 100}%` }} transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }} />
              </div>
              {reward.levelAfter > reward.levelBefore && <div className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-accent2"><Star size={12} /> Level up! You reached level {reward.levelAfter}.</div>}
            </div>
          </div>

          <div className="card flex items-center gap-4 p-5">
            <motion.div initial={reduced ? false : { scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.5 }}>
              <StreakFlame streak={reward.streakAfter} size={64} />
            </motion.div>
            <div className="min-w-0">
              <div className="label">Streak</div>
              <div className="text-3xl font-extrabold tabular">{reward.streakAfter} <span className="text-base font-semibold text-muted">day{reward.streakAfter === 1 ? '' : 's'}</span></div>
              <p className="mt-0.5 text-xs text-muted">
                {reward.streakRestarted
                  ? 'Welcome back! Every streak starts with one day — this one begins today.'
                  : reward.streakIncremented
                    ? reward.streakMilestone ? `Milestone: ${reward.streakMilestone} days in a row!` : 'Streak extended. Come back tomorrow to keep it burning.'
                    : "Today's streak is already counted. See you tomorrow!"}
              </p>
              {reward.freezesUsed > 0 && <p className="mt-1 flex items-center gap-1 text-xs text-accent"><Snowflake size={12} /> A streak freeze covered your missed day.</p>}
              {reward.freezeEarned && <p className="mt-1 flex items-center gap-1 text-xs text-accent"><Snowflake size={12} /> You earned a streak freeze ({streakFreezes} held).</p>}
            </div>
          </div>

          <div className="card flex items-center gap-4 p-5">
            <ProgressRing pct={goalPct} size={84} color={goalPct >= 1 ? 'var(--success)' : 'var(--accent)'} label={`Daily goal ${Math.round(goalPct * 100)}%`}>
              <span className="text-sm font-bold tabular">{Math.round(goalPct * 100)}%</span>
            </ProgressRing>
            <div>
              <div className="label">Daily goal</div>
              <div className="text-lg font-bold tabular">{Math.min(reward.dailyMinutes, 9999).toFixed(1)} / {goal} min</div>
              <p className="text-xs text-muted">{goalPct >= 1 ? 'Goal reached — anything more is a bonus.' : 'Keep going to fill your ring.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* badges */}
      {reward.newBadges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-5">
          <div className="label mb-3 flex items-center gap-1.5"><Award size={14} /> New badge{reward.newBadges.length > 1 ? 's' : ''} unlocked</div>
          <div className="grid gap-3 sm:grid-cols-2">{reward.newBadges.map((id) => <BadgeChip key={id} id={id} />)}</div>
        </motion.div>
      )}
      {reward.newThemes.length > 0 && (
        <div className="card flex items-center gap-2 p-4 text-sm"><Flame size={16} className="text-caret" /> New theme{reward.newThemes.length > 1 ? 's' : ''} unlocked: <strong>{reward.newThemes.map((t) => themeById(t).name).join(', ')}</strong> — pick it in Settings.</div>
      )}

      {reward.counted && (
        <ShareCard data={{ wpm: result.netWpm, accuracy: result.accuracy, consistency: result.consistency, durationSec: result.durationSec, label, streak: reward.streakAfter, level: reward.levelAfter, isPB: reward.isPB }} />
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pb-6">{actions}</div>
    </div>
  );
}
