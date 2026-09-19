import { addDays, daysBetween } from './date';

/* ───────────── Levels & XP ───────────── */

/** Cumulative XP needed to reach `level` (level 1 = 0). Each level costs 50 more than the last. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 25 * (level - 1) * (level + 2);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  into: number;
  needed: number;
  pct: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const into = xp - base;
  const needed = next - base;
  return { level, into, needed, pct: needed ? into / needed : 0 };
}

export interface XpInput {
  correctChars: number;
  accuracy: number;
  durationSec: number;
  isPB: boolean;
  perfect: boolean;
  firstOfDay: boolean;
  challengeCompleted: boolean;
  lessonPassedFirstTime: boolean;
  chapterFirstTime: boolean;
  bookCompleted: boolean;
}

export interface XpLine {
  label: string;
  xp: number;
}

/** Everything that earns XP lives here so it's easy to tune and test. */
export function computeXp(i: XpInput): XpLine[] {
  const lines: XpLine[] = [];
  const words = i.correctChars / 5;
  const accMult = i.accuracy >= 98 ? 1.25 : i.accuracy >= 92 ? 1.1 : i.accuracy >= 80 ? 1 : 0.7;
  const base = Math.max(1, Math.round(words * accMult));
  lines.push({ label: 'Typing', xp: base });
  if (i.isPB) lines.push({ label: 'Personal best', xp: 25 });
  if (i.perfect) lines.push({ label: 'Perfect run', xp: 20 });
  if (i.firstOfDay) lines.push({ label: 'First session today', xp: 10 });
  if (i.challengeCompleted) lines.push({ label: 'Daily challenge', xp: 50 });
  if (i.lessonPassedFirstTime) lines.push({ label: 'Lesson passed', xp: 30 });
  if (i.chapterFirstTime) lines.push({ label: 'Chapter finished', xp: 25 });
  if (i.bookCompleted) lines.push({ label: 'Book completed', xp: 100 });
  return lines;
}

/* ───────────── Streaks ───────────── */

export interface Streak {
  current: number;
  longest: number;
  /** last local date (YYYY-MM-DD) with a qualifying session */
  lastActiveDate: string | null;
  /** dates with a qualifying session */
  history: string[];
  /** dates that were covered by a streak freeze */
  frozen: string[];
}

export const emptyStreak = (): Streak => ({
  current: 0,
  longest: 0,
  lastActiveDate: null,
  history: [],
  frozen: [],
});

export const STREAK_MILESTONES = [3, 7, 14, 30, 100, 365];

/**
 * The streak the user should *see* today. A streak that is broken (and can't
 * be saved by freezes) reads as 0 until they practise again.
 */
export function effectiveStreak(streak: Streak, today: string, freezes: number): number {
  if (!streak.lastActiveDate || streak.current === 0) return 0;
  const gap = daysBetween(streak.lastActiveDate, today);
  if (gap <= 1) return streak.current;
  const missed = gap - 1;
  return freezes >= missed ? streak.current : 0;
}

/** Practised today already? */
export function practisedToday(streak: Streak, today: string): boolean {
  return streak.lastActiveDate === today;
}

export interface StreakAdvance {
  streak: Streak;
  freezesLeft: number;
  incremented: boolean;
  /** a run was broken and started over */
  restarted: boolean;
  freezesUsed: number;
  milestone: number | null;
  /** streak length before this session as shown to the user */
  before: number;
}

/** Register a qualifying session on `today`. Increments at most once per local day. */
export function advanceStreak(streak: Streak, today: string, freezes: number): StreakAdvance {
  const before = effectiveStreak(streak, today, freezes);
  if (streak.lastActiveDate === today) {
    return { streak, freezesLeft: freezes, incremented: false, restarted: false, freezesUsed: 0, milestone: null, before };
  }

  let current: number;
  let freezesUsed = 0;
  let restarted = false;
  const frozen = streak.frozen.slice();

  if (!streak.lastActiveDate) {
    current = 1;
  } else {
    const gap = daysBetween(streak.lastActiveDate, today);
    if (gap <= 1) {
      current = streak.current + 1;
    } else {
      const missed = gap - 1;
      if (freezes >= missed && streak.current > 0) {
        freezesUsed = missed;
        for (let d = 1; d <= missed; d++) frozen.push(addDays(streak.lastActiveDate, d));
        current = streak.current + 1;
      } else {
        current = 1;
        restarted = streak.current > 0;
      }
    }
  }

  const next: Streak = {
    current,
    longest: Math.max(streak.longest, current),
    lastActiveDate: today,
    history: streak.history.includes(today) ? streak.history : [...streak.history, today].slice(-800),
    frozen: frozen.slice(-200),
  };
  return {
    streak: next,
    freezesLeft: freezes - freezesUsed,
    incremented: true,
    restarted,
    freezesUsed,
    milestone: STREAK_MILESTONES.includes(current) ? current : null,
    before,
  };
}

/* ───────────── Benchmark ───────────── */

/**
 * Percentile against a model of typical typists (mean ≈ 40 WPM, sd ≈ 17),
 * based on widely-published averages. Not live player data — Keyflow has no
 * server — so the UI labels it as "vs. typical typists".
 */
export function typistPercentile(wpm: number): number {
  const mean = 40;
  const sd = 17;
  const z = (wpm - mean) / sd;
  // logistic approximation of the normal CDF
  const p = 1 / (1 + Math.exp(-1.702 * z));
  return Math.max(1, Math.min(99, Math.round(p * 100)));
}
