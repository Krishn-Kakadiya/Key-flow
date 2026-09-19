import { create } from 'zustand';
import { persist, type StateStorage, createJSONStorage } from 'zustand/middleware';
import type { Data, Mode, Prefs, Reward, Session, SessionRef, Settings } from '../types';
import type { EngineResult } from '../lib/engine';
import { defaultData, sanitize, SCHEMA_VERSION, MAX_SESSIONS, MAX_FREEZES, FREEZE_COST, newId } from './defaults';
import { toDateStr } from '../lib/date';
import { advanceStreak, computeXp, levelFromXp, effectiveStreak } from '../lib/progress';
import { evaluateBadges, type BadgeCtx } from '../lib/badges';
import { LESSONS, PASS_ACCURACY, starsFor } from '../data/lessons';
import { STORIES } from '../data/stories';
import { challengeGoalMet } from '../lib/challenge';
import { newlyUnlocked, unlockedThemes } from '../lib/themes';

export const STORAGE_KEY = 'keyflow:v1';

/** localStorage that never throws (private windows, blocked storage, quota…). */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* ignore */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};

export interface SessionInput {
  result: EngineResult;
  mode: Mode;
  modeKey: string;
  ref?: SessionRef;
  tag?: 'baseline';
  /** ghost recording is only kept for these (time-boxed / comparable) runs */
  keepGhost?: boolean;
}

export interface Actions {
  completeSession: (input: SessionInput) => Reward;
  setSettings: (patch: Partial<Settings>) => void;
  setPrefs: (patch: Partial<Prefs>) => void;
  setDailyGoal: (minutes: number) => void;
  finishOnboarding: (opts: { baselineWpm?: number | null; goalMinutes?: number }) => void;
  buyFreeze: () => boolean;
  resetAll: () => void;
  exportData: () => string;
  importData: (json: string) => { ok: true } | { ok: false; error: string };
}

export type Store = Data & Actions;

const DATA_KEYS: (keyof Data)[] = [
  'profile', 'settings', 'prefs', 'streak', 'sessions', 'records', 'badges',
  'stories', 'lessons', 'challenges', 'totals', 'minutesByDate',
];

function pickData(s: Store): Data {
  const out = {} as Record<string, unknown>;
  for (const k of DATA_KEYS) out[k] = s[k];
  return out as unknown as Data;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...defaultData(),

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),
      setDailyGoal: (minutes) => set((s) => ({ profile: { ...s.profile, dailyGoalMinutes: minutes } })),

      finishOnboarding: ({ baselineWpm, goalMinutes }) =>
        set((s) => ({
          profile: {
            ...s.profile,
            onboarded: true,
            baselineWpm: baselineWpm ?? s.profile.baselineWpm,
            dailyGoalMinutes: goalMinutes ?? s.profile.dailyGoalMinutes,
          },
        })),

      buyFreeze: () => {
        const s = get();
        const spendable = s.profile.xp - s.profile.spentXp;
        if (s.profile.streakFreezes >= MAX_FREEZES || spendable < FREEZE_COST) return false;
        set({
          profile: {
            ...s.profile,
            spentXp: s.profile.spentXp + FREEZE_COST,
            streakFreezes: s.profile.streakFreezes + 1,
          },
        });
        return true;
      },

      resetAll: () => {
        const fresh = defaultData();
        // keep appearance preferences; everything else is wiped
        fresh.settings = { ...fresh.settings, ...get().settings, unlockAllLessons: false };
        fresh.settings.theme = 'dark';
        set(fresh);
      },

      exportData: () =>
        JSON.stringify({ app: 'keyflow', version: SCHEMA_VERSION, exportedAt: new Date().toISOString(), data: pickData(get()) }, null, 2),

      importData: (json) => {
        try {
          const parsed: unknown = JSON.parse(json);
          if (typeof parsed !== 'object' || parsed === null) return { ok: false, error: 'That file is not a Keyflow backup.' };
          const wrapper = parsed as { app?: unknown; data?: unknown };
          if (wrapper.app !== 'keyflow' || typeof wrapper.data !== 'object' || wrapper.data === null) {
            return { ok: false, error: 'That file is not a Keyflow backup.' };
          }
          set(sanitize(wrapper.data));
          return { ok: true };
        } catch {
          return { ok: false, error: 'That file could not be read (invalid JSON).' };
        }
      },

      completeSession: (input) => {
        const s = get();
        const { result: r } = input;
        const now = new Date();
        const today = toDateStr(now);
        const counted = r.correctChars >= 15;

        const emptyReward: Reward = {
          counted: false, xp: 0, xpLines: [], levelBefore: levelFromXp(s.profile.xp), levelAfter: levelFromXp(s.profile.xp),
          xpBefore: s.profile.xp, xpAfter: s.profile.xp, isPB: false, isFirstRecord: false, previousBest: 0,
          streakBefore: effectiveStreak(s.streak, today, s.profile.streakFreezes), streakAfter: effectiveStreak(s.streak, today, s.profile.streakFreezes),
          streakIncremented: false, streakRestarted: false, streakMilestone: null, freezesUsed: 0, freezeEarned: false,
          newBadges: [], bookCompleted: false, chapterUnlocked: false, lessonPassed: false, lessonStars: 0,
          challengeCompleted: false, challengeGoalMet: false, newThemes: [], dailyMinutes: s.minutesByDate[today] ?? 0,
        };
        if (!counted) return emptyReward;

        const session: Session = {
          id: newId(),
          timestamp: now.getTime(),
          mode: input.mode,
          modeKey: input.modeKey,
          durationSec: r.durationSec,
          rawWpm: r.rawWpm,
          netWpm: r.netWpm,
          accuracy: r.accuracy,
          consistency: r.consistency,
          charsTyped: r.charsTyped,
          errors: r.errors,
          wpmSeries: r.wpmSeries,
          seriesStep: r.seriesStep,
          keyErrors: r.keyErrors,
          ref: input.ref,
          tag: input.tag,
        };

        /* personal record */
        const recordable = input.mode !== 'zen' && input.mode !== 'custom';
        const previousBest = s.records.bestWpmByMode[input.modeKey] ?? 0;
        const eligible = recordable && r.accuracy >= 85 && r.netWpm >= 10;
        const isPB = eligible && r.netWpm > previousBest;
        const records = {
          bestWpmByMode: isPB ? { ...s.records.bestWpmByMode, [input.modeKey]: r.netWpm } : s.records.bestWpmByMode,
          ghosts: s.records.ghosts,
        };
        if (isPB && input.keepGhost && r.cumChars.length) {
          records.ghosts = { ...records.ghosts, [input.modeKey]: { wpm: r.netWpm, cum: r.cumChars, step: r.seriesStep } };
        }

        /* streak */
        const adv = advanceStreak(s.streak, today, s.profile.streakFreezes);
        let freezes = adv.freezesLeft;
        const freezeEarned = adv.incremented && adv.streak.current % 7 === 0 && freezes < MAX_FREEZES;
        if (freezeEarned) freezes += 1;

        /* story / lesson / challenge context */
        const stories = { ...s.stories };
        const lessons = { ...s.lessons };
        const challenges = { ...s.challenges };
        let chapterFirstTime = false;
        let bookCompleted = false;
        let chapterUnlocked = false;
        let lessonPassed = false;
        let lessonFirstPass = false;
        let lessonStars = 0;
        let challengeFirstCompletion = false;
        let goalMet = false;

        if (input.ref?.type === 'story') {
          const { storyId, chapter } = input.ref;
          const story = STORIES.find((x) => x.id === storyId);
          const prev = stories[storyId] ?? { storyId, completedChapters: [], stats: {}, lastPlayed: 0, completedAt: null };
          chapterFirstTime = !prev.completedChapters.includes(chapter);
          const completed = chapterFirstTime ? [...prev.completedChapters, chapter] : prev.completedChapters;
          const old = prev.stats[chapter];
          const stats = { ...prev.stats, [chapter]: old && old.wpm >= r.netWpm ? old : { wpm: r.netWpm, accuracy: r.accuracy } };
          const allDone = !!story && story.chapters.every((_, i) => completed.includes(i));
          bookCompleted = allDone && prev.completedAt === null;
          chapterUnlocked = chapterFirstTime && !!story && chapter + 1 < story.chapters.length;
          stories[storyId] = { storyId, completedChapters: completed, stats, lastPlayed: now.getTime(), completedAt: allDone ? (prev.completedAt ?? now.getTime()) : null };
        } else if (input.ref?.type === 'lesson') {
          const { lessonId } = input.ref;
          const prev = lessons[lessonId] ?? { lessonId, passed: false, bestAccuracy: 0, bestWpm: 0, stars: 0, attempts: 0 };
          lessonPassed = r.accuracy >= PASS_ACCURACY;
          lessonStars = starsFor(r.accuracy);
          lessonFirstPass = lessonPassed && !prev.passed;
          lessons[lessonId] = {
            lessonId,
            passed: prev.passed || lessonPassed,
            bestAccuracy: Math.max(prev.bestAccuracy, r.accuracy),
            bestWpm: Math.max(prev.bestWpm, r.netWpm),
            stars: Math.max(prev.stars, lessonStars),
            attempts: prev.attempts + 1,
          };
        } else if (input.ref?.type === 'challenge') {
          const { date, ctype } = input.ref;
          const prev = challenges[date] ?? { date, type: ctype, completed: false, attempts: 0, bestWpm: 0, bestAccuracy: 0 };
          goalMet = challengeGoalMet(ctype, r.accuracy);
          challengeFirstCompletion = goalMet && !prev.completed;
          challenges[date] = {
            date,
            type: ctype,
            completed: prev.completed || goalMet,
            attempts: prev.attempts + 1,
            bestWpm: Math.max(prev.bestWpm, r.netWpm),
            bestAccuracy: Math.max(prev.bestAccuracy, r.accuracy),
          };
        }

        /* XP */
        const perfect = r.accuracy === 100 && r.correctChars >= 40;
        const xpLines = computeXp({
          correctChars: r.correctChars,
          accuracy: r.accuracy,
          durationSec: r.durationSec,
          isPB,
          perfect,
          firstOfDay: adv.incremented,
          challengeCompleted: challengeFirstCompletion,
          lessonPassedFirstTime: lessonFirstPass,
          chapterFirstTime,
          bookCompleted,
        });
        const xp = xpLines.reduce((a, l) => a + l.xp, 0);
        const xpBefore = s.profile.xp;
        const xpAfter = xpBefore + xp;
        const levelBefore = levelFromXp(xpBefore);
        const levelAfter = levelFromXp(xpAfter);

        /* totals */
        const keyStats = { ...s.totals.keyStats };
        for (const [k, hits] of Object.entries(r.keyHits)) {
          if (k.length !== 1) continue;
          const prev = keyStats[k] ?? { hits: 0, errors: 0, ms: 0 };
          keyStats[k] = { hits: prev.hits + hits, errors: prev.errors + (r.keyErrors[k] ?? 0), ms: prev.ms + (r.keyMs[k] ?? 0) };
        }
        const totals = {
          sessions: s.totals.sessions + 1,
          seconds: s.totals.seconds + r.durationSec,
          chars: s.totals.chars + r.charsTyped,
          correctChars: s.totals.correctChars + r.correctChars,
          perfectRuns: s.totals.perfectRuns + (perfect ? 1 : 0),
          maxCombo: Math.max(s.totals.maxCombo, r.maxCombo),
          zenSeconds: s.totals.zenSeconds + (input.mode === 'zen' ? r.durationSec : 0),
          keyStats,
        };
        const minutesByDate = { ...s.minutesByDate, [today]: (s.minutesByDate[today] ?? 0) + r.durationSec / 60 };

        /* badges */
        const passedLessons = Object.values(lessons).filter((l) => l.passed).length;
        const homeRowIds = LESSONS.filter((l) => l.section === 'Home row').map((l) => l.id);
        const ctx: BadgeCtx = {
          session,
          sessions: totals.sessions,
          totalWords: Math.floor(totals.correctChars / 5),
          // only accurate runs (recorded as personal bests) count toward speed badges
          bestWpm: Math.max(0, ...Object.values(records.bestWpmByMode)),
          streak: adv.streak.current,
          longestStreak: adv.streak.longest,
          level: levelAfter,
          chaptersDone: Object.values(stories).reduce((a, st) => a + st.completedChapters.length, 0),
          booksDone: Object.values(stories).filter((st) => st.completedAt !== null).length,
          lessonsPassed: passedLessons,
          lessonsTotal: LESSONS.length,
          homeRowDone: homeRowIds.every((id) => lessons[id]?.passed),
          challengesDone: Object.values(challenges).filter((c) => c.completed).length,
          maxCombo: totals.maxCombo,
          perfectRun: perfect,
          zenSeconds: totals.zenSeconds,
          hour: now.getHours(),
        };
        const newBadges = evaluateBadges(ctx, s.badges);
        const badges = { ...s.badges };
        for (const id of newBadges) badges[id] = now.getTime();

        const newThemes = newlyUnlocked(levelBefore, levelAfter).map((t) => t.id);

        set({
          profile: {
            ...s.profile,
            xp: xpAfter,
            streakFreezes: freezes,
            baselineWpm: input.tag === 'baseline' ? r.netWpm : s.profile.baselineWpm,
          },
          streak: adv.streak,
          sessions: [...s.sessions, session].slice(-MAX_SESSIONS),
          records,
          badges,
          stories,
          lessons,
          challenges,
          totals,
          minutesByDate,
        });

        return {
          counted: true,
          xp,
          xpLines,
          levelBefore,
          levelAfter,
          xpBefore,
          xpAfter,
          isPB,
          isFirstRecord: isPB && previousBest === 0,
          previousBest,
          streakBefore: adv.before,
          streakAfter: adv.streak.current,
          streakIncremented: adv.incremented,
          streakRestarted: adv.restarted,
          streakMilestone: adv.milestone,
          freezesUsed: adv.freezesUsed,
          freezeEarned,
          newBadges,
          bookCompleted,
          chapterUnlocked,
          lessonPassed,
          lessonStars,
          challengeCompleted: challengeFirstCompletion,
          challengeGoalMet: goalMet,
          newThemes,
          dailyMinutes: minutesByDate[today],
        };
      },
    }),
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => pickData(s as Store) as unknown as Store,
      // Corrupt or partial saved data falls back to clean defaults instead of crashing.
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
    },
  ),
);

/* ───────────── selectors / helpers ───────────── */

export function spendableXp(d: Pick<Data, 'profile'>): number {
  return d.profile.xp - d.profile.spentXp;
}

export function currentLevel(d: Pick<Data, 'profile'>): number {
  return levelFromXp(d.profile.xp);
}

export function availableThemeIds(d: Pick<Data, 'profile'>): string[] {
  return unlockedThemes(currentLevel(d)).map((t) => t.id);
}

/** Highest unlocked chapter index for a story. */
export function unlockedChapter(d: Pick<Data, 'stories'>, storyId: string): number {
  const p = d.stories[storyId];
  if (!p || !p.completedChapters.length) return 0;
  const story = STORIES.find((s) => s.id === storyId);
  const max = story ? story.chapters.length - 1 : 0;
  return Math.min(max, Math.max(...p.completedChapters) + 1);
}

export function isLessonUnlocked(d: Pick<Data, 'lessons' | 'settings'>, index: number): boolean {
  if (d.settings.unlockAllLessons || index === 0) return true;
  const prev = LESSONS[index - 1];
  return !!prev && !!d.lessons[prev.id]?.passed;
}
