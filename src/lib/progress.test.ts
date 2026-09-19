import { describe, expect, it } from 'vitest';
import {
  advanceStreak, effectiveStreak, emptyStreak, levelFromXp, levelProgress, xpForLevel, computeXp, typistPercentile,
  type Streak,
} from './progress';
import { addDays, daysBetween, toDateStr } from './date';

const streakOf = (current: number, last: string): Streak => ({
  current,
  longest: current,
  lastActiveDate: last,
  history: [last],
  frozen: [],
});

describe('dates', () => {
  it('uses local calendar dates and DST-safe day maths', () => {
    expect(toDateStr(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
});

describe('streak', () => {
  it('starts at 1 on the first session', () => {
    const r = advanceStreak(emptyStreak(), '2026-05-01', 0);
    expect(r.streak.current).toBe(1);
    expect(r.incremented).toBe(true);
  });

  it('increments at most once per local day', () => {
    const a = advanceStreak(emptyStreak(), '2026-05-01', 0);
    const b = advanceStreak(a.streak, '2026-05-01', 0);
    expect(b.incremented).toBe(false);
    expect(b.streak.current).toBe(1);
  });

  it('increments on consecutive days and tracks longest', () => {
    let st = emptyStreak();
    for (const d of ['2026-05-01', '2026-05-02', '2026-05-03']) st = advanceStreak(st, d, 0).streak;
    expect(st.current).toBe(3);
    expect(st.longest).toBe(3);
  });

  it('flags milestones', () => {
    const r = advanceStreak(streakOf(2, '2026-05-02'), '2026-05-03', 0);
    expect(r.milestone).toBe(3);
  });

  it('a missed day resets the streak without a freeze', () => {
    const r = advanceStreak(streakOf(5, '2026-05-01'), '2026-05-03', 0);
    expect(r.streak.current).toBe(1);
    expect(r.restarted).toBe(true);
    expect(r.streak.longest).toBe(5);
  });

  it('a freeze covers exactly one missed day', () => {
    const r = advanceStreak(streakOf(5, '2026-05-01'), '2026-05-03', 1);
    expect(r.streak.current).toBe(6);
    expect(r.freezesUsed).toBe(1);
    expect(r.freezesLeft).toBe(0);
    expect(r.streak.frozen).toEqual(['2026-05-02']);
  });

  it('one freeze does not cover two missed days', () => {
    const r = advanceStreak(streakOf(5, '2026-05-01'), '2026-05-04', 1);
    expect(r.streak.current).toBe(1);
    expect(r.freezesUsed).toBe(0);
  });

  it('effective streak shows 0 once it can no longer be saved', () => {
    const st = streakOf(9, '2026-05-01');
    expect(effectiveStreak(st, '2026-05-01', 0)).toBe(9);
    expect(effectiveStreak(st, '2026-05-02', 0)).toBe(9); // still alive today
    expect(effectiveStreak(st, '2026-05-03', 0)).toBe(0);
    expect(effectiveStreak(st, '2026-05-03', 1)).toBe(9);
  });
});

describe('xp & levels', () => {
  it('level thresholds grow by 50 each level', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(xpForLevel(3)).toBe(250);
    expect(xpForLevel(4)).toBe(450);
  });
  it('maps xp to level and progress', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(449)).toBe(3);
    const p = levelProgress(175);
    expect(p.level).toBe(2);
    expect(p.into).toBe(75);
    expect(p.needed).toBe(150);
  });
  it('awards bonuses in the breakdown', () => {
    const lines = computeXp({
      correctChars: 250, accuracy: 100, durationSec: 60, isPB: true, perfect: true, firstOfDay: true,
      challengeCompleted: true, lessonPassedFirstTime: false, chapterFirstTime: false, bookCompleted: false,
    });
    const total = lines.reduce((a, l) => a + l.xp, 0);
    expect(lines.map((l) => l.label)).toEqual(['Typing', 'Personal best', 'Perfect run', 'First session today', 'Daily challenge']);
    expect(total).toBeGreaterThan(100);
  });
  it('always awards at least 1 XP for typing', () => {
    const lines = computeXp({
      correctChars: 1, accuracy: 10, durationSec: 1, isPB: false, perfect: false, firstOfDay: false,
      challengeCompleted: false, lessonPassedFirstTime: false, chapterFirstTime: false, bookCompleted: false,
    });
    expect(lines[0].xp).toBeGreaterThanOrEqual(1);
  });
});

describe('benchmark', () => {
  it('is monotonic and bounded', () => {
    expect(typistPercentile(10)).toBeLessThan(typistPercentile(40));
    expect(typistPercentile(40)).toBeLessThan(typistPercentile(90));
    expect(typistPercentile(500)).toBeLessThanOrEqual(99);
    expect(typistPercentile(0)).toBeGreaterThanOrEqual(1);
  });
});
