import type { Data, Draft, Prefs, Profile, Records, Settings, Totals } from '../types';
import { emptyStreak, type Streak } from '../lib/progress';
import { isValidDateStr } from '../lib/date';
import { THEMES, DEFAULT_THEME } from '../lib/themes';

export const SCHEMA_VERSION = 1;
export const MAX_SESSIONS = 400;
export const MAX_DRAFTS = 20;
export const MAX_FREEZES = 3;
export const FREEZE_COST = 150;

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const newId = uid;

export function defaultProfile(): Profile {
  return {
    id: uid(),
    createdAt: Date.now(),
    baselineWpm: null,
    onboarded: false,
    xp: 0,
    spentXp: 0,
    dailyGoalMinutes: 10,
    streakFreezes: 0,
  };
}

export const defaultSettings = (): Settings => ({
  theme: DEFAULT_THEME,
  sound: false,
  volume: 0.6,
  fontSize: 30,
  reducedMotion: 'system',
  noPeeking: false,
  unlockAllLessons: false,
  hideMobileHint: false,
});

export const defaultPrefs = (): Prefs => ({
  mode: 'time',
  time: 30,
  words: 25,
  quote: 'short',
  punctuation: false,
  numbers: false,
  difficulty: 'mixed',
  ghost: true,
  codeLang: 'any',
  customText: '',
});

export const defaultTotals = (): Totals => ({
  sessions: 0,
  seconds: 0,
  chars: 0,
  correctChars: 0,
  perfectRuns: 0,
  maxCombo: 0,
  zenSeconds: 0,
  keyStats: {},
});

export const defaultRecords = (): Records => ({ bestWpmByMode: {}, ghosts: {} });

export function defaultData(): Data {
  return {
    profile: defaultProfile(),
    settings: defaultSettings(),
    prefs: defaultPrefs(),
    streak: emptyStreak(),
    sessions: [],
    records: defaultRecords(),
    badges: {},
    stories: {},
    lessons: {},
    challenges: {},
    totals: defaultTotals(),
    minutesByDate: {},
    drafts: {},
  };
}

/* ───────────── sanitising (corrupt / hand-edited / imported data) ───────────── */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, fallback: number, min = -Infinity, max = Infinity) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
const numArray = (v: unknown, limit = 400) =>
  Array.isArray(v) ? v.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)).slice(0, limit) : [];
const numRecord = (v: unknown): Record<string, number> => {
  const out: Record<string, number> = {};
  if (isObj(v)) for (const [k, n] of Object.entries(v)) if (typeof n === 'number' && Number.isFinite(n)) out[k] = n;
  return out;
};

const triples = (v: unknown, limit: number): Array<[number, number, number]> =>
  Array.isArray(v)
    ? (v.filter((w) => Array.isArray(w) && w.length === 3 && w.every((n) => typeof n === 'number' && Number.isFinite(n))).slice(0, limit) as Array<[number, number, number]>)
    : [];

const pairs = (v: unknown, limit: number): Array<[number, number]> =>
  Array.isArray(v)
    ? (v.filter((w) => Array.isArray(w) && w.length === 2 && w.every((n) => typeof n === 'number' && Number.isFinite(n))).slice(0, limit) as Array<[number, number]>)
    : [];

function cleanDraft(key: string, v: unknown): Draft | null {
  if (!isObj(v) || !isObj(v.snapshot)) return null;
  const sn = v.snapshot;
  if (typeof sn.typed !== 'string' || sn.typed.length === 0 || sn.typed.length > 40000) return null;
  return {
    key,
    sig: num(v.sig, 0),
    savedAt: num(v.savedAt, 0),
    textLength: num(v.textLength, sn.typed.length, 1),
    creditedMs: num(v.creditedMs, 0, 0),
    snapshot: {
      typed: sn.typed,
      elapsedMs: num(sn.elapsedMs, 0, 0),
      keystrokes: Math.floor(num(sn.keystrokes, 0, 0)),
      correctKeystrokes: Math.floor(num(sn.correctKeystrokes, 0, 0)),
      errors: Math.floor(num(sn.errors, 0, 0)),
      correct: Math.floor(num(sn.correct, 0, 0)),
      maxCombo: Math.floor(num(sn.maxCombo, 0, 0)),
      keyErrors: numRecord(sn.keyErrors),
      keyHits: numRecord(sn.keyHits),
      keyMs: numRecord(sn.keyMs),
      words: triples(sn.words, 8000),
      snaps: numArray(sn.snaps, 20000),
      autoRanges: pairs(sn.autoRanges, 2000),
    },
  };
}

function cleanSession(v: unknown): Data['sessions'][number] | null {
  if (!isObj(v)) return null;
  if (typeof v.netWpm !== 'number' || typeof v.timestamp !== 'number') return null;
  const s: Data['sessions'][number] = {
    id: str(v.id, uid()),
    timestamp: v.timestamp,
    mode: (['time', 'words', 'quote', 'zen', 'custom', 'code', 'lesson', 'story', 'challenge'] as const).includes(v.mode as never)
      ? (v.mode as Data['sessions'][number]['mode'])
      : 'time',
    modeKey: str(v.modeKey, str(v.mode, 'time')),
    durationSec: num(v.durationSec, 0, 0),
    rawWpm: num(v.rawWpm, 0, 0, 1000),
    netWpm: num(v.netWpm, 0, 0, 1000),
    accuracy: num(v.accuracy, 0, 0, 100),
    consistency: num(v.consistency, 0, 0, 100),
    charsTyped: num(v.charsTyped, 0, 0),
    errors: num(v.errors, 0, 0),
    wpmSeries: numArray(v.wpmSeries, 300),
    seriesStep: num(v.seriesStep, 1, 1),
    keyErrors: numRecord(v.keyErrors),
  };
  if (v.tag === 'baseline') s.tag = 'baseline';
  return s;
}

/** Merge unknown data onto defaults, keeping only well-formed pieces. Never throws. */
export function sanitize(raw: unknown): Data {
  const d = defaultData();
  if (!isObj(raw)) return d;

  if (isObj(raw.profile)) {
    const p = raw.profile;
    d.profile = {
      id: str(p.id, d.profile.id),
      createdAt: num(p.createdAt, d.profile.createdAt),
      baselineWpm: p.baselineWpm === null ? null : num(p.baselineWpm, 0, 0, 1000) || null,
      onboarded: bool(p.onboarded, false),
      xp: num(p.xp, 0, 0),
      spentXp: num(p.spentXp, 0, 0),
      dailyGoalMinutes: num(p.dailyGoalMinutes, 10, 1, 240),
      streakFreezes: Math.floor(num(p.streakFreezes, 0, 0, MAX_FREEZES)),
    };
  }

  if (isObj(raw.settings)) {
    const s = raw.settings;
    d.settings = {
      theme: THEMES.some((t) => t.id === s.theme) ? (s.theme as string) : DEFAULT_THEME,
      sound: bool(s.sound, false),
      volume: num(s.volume, 0.6, 0, 1),
      fontSize: num(s.fontSize, 30, 20, 48),
      reducedMotion: s.reducedMotion === 'on' || s.reducedMotion === 'off' ? s.reducedMotion : 'system',
      noPeeking: bool(s.noPeeking, false),
      unlockAllLessons: bool(s.unlockAllLessons, false),
      hideMobileHint: bool(s.hideMobileHint, false),
    };
  }

  if (isObj(raw.prefs)) {
    const p = raw.prefs;
    const dp = d.prefs;
    d.prefs = {
      mode: (['time', 'words', 'quote', 'zen', 'custom', 'code', 'weak'] as const).includes(p.mode as never) ? (p.mode as Prefs['mode']) : dp.mode,
      time: [15, 30, 60, 120].includes(p.time as number) ? (p.time as number) : dp.time,
      words: [10, 25, 50, 100].includes(p.words as number) ? (p.words as number) : dp.words,
      quote: p.quote === 'medium' || p.quote === 'long' ? p.quote : 'short',
      punctuation: bool(p.punctuation, false),
      numbers: bool(p.numbers, false),
      difficulty: p.difficulty === 'easy' || p.difficulty === 'hard' ? p.difficulty : 'mixed',
      ghost: bool(p.ghost, true),
      codeLang: ['js', 'python', 'css', 'sql'].includes(p.codeLang as string) ? (p.codeLang as Prefs['codeLang']) : 'any',
      customText: str(p.customText, '').slice(0, 10000),
    };
  }

  if (isObj(raw.streak)) {
    const s = raw.streak;
    const streak: Streak = {
      current: Math.floor(num(s.current, 0, 0)),
      longest: Math.floor(num(s.longest, 0, 0)),
      lastActiveDate: isValidDateStr(s.lastActiveDate) ? s.lastActiveDate : null,
      history: Array.isArray(s.history) ? s.history.filter(isValidDateStr).slice(-800) : [],
      frozen: Array.isArray(s.frozen) ? s.frozen.filter(isValidDateStr).slice(-200) : [],
    };
    if (!streak.lastActiveDate) streak.current = 0;
    streak.longest = Math.max(streak.longest, streak.current);
    d.streak = streak;
  }

  if (Array.isArray(raw.sessions)) {
    d.sessions = raw.sessions.map(cleanSession).filter((s): s is NonNullable<typeof s> => !!s).slice(-MAX_SESSIONS);
  }

  if (isObj(raw.records)) {
    d.records.bestWpmByMode = numRecord(raw.records.bestWpmByMode);
    if (isObj(raw.records.ghosts)) {
      for (const [k, g] of Object.entries(raw.records.ghosts)) {
        if (isObj(g)) {
          const cum = numArray(g.cum, 300);
          if (cum.length) d.records.ghosts[k] = { wpm: num(g.wpm, 0, 0), cum, step: num(g.step, 1, 1) };
        }
      }
    }
  }

  d.badges = numRecord(raw.badges);

  if (isObj(raw.stories)) {
    for (const [id, v] of Object.entries(raw.stories)) {
      if (!isObj(v)) continue;
      const stats: Record<number, { wpm: number; accuracy: number }> = {};
      if (isObj(v.stats)) {
        for (const [ch, st] of Object.entries(v.stats)) {
          if (isObj(st)) stats[Number(ch)] = { wpm: num(st.wpm, 0, 0), accuracy: num(st.accuracy, 0, 0, 100) };
        }
      }
      d.stories[id] = {
        storyId: id,
        completedChapters: numArray(v.completedChapters, 100).map(Math.floor),
        stats,
        lastPlayed: num(v.lastPlayed, 0),
        completedAt: typeof v.completedAt === 'number' ? v.completedAt : null,
      };
    }
  }

  if (isObj(raw.lessons)) {
    for (const [id, v] of Object.entries(raw.lessons)) {
      if (!isObj(v)) continue;
      d.lessons[id] = {
        lessonId: id,
        passed: bool(v.passed, false),
        bestAccuracy: num(v.bestAccuracy, 0, 0, 100),
        bestWpm: num(v.bestWpm, 0, 0),
        stars: Math.floor(num(v.stars, 0, 0, 3)),
        attempts: Math.floor(num(v.attempts, 0, 0)),
      };
    }
  }

  if (isObj(raw.challenges)) {
    for (const [date, v] of Object.entries(raw.challenges)) {
      if (!isValidDateStr(date) || !isObj(v)) continue;
      d.challenges[date] = {
        date,
        type: str(v.type, 'sprint'),
        completed: bool(v.completed, false),
        attempts: Math.floor(num(v.attempts, 0, 0)),
        bestWpm: num(v.bestWpm, 0, 0),
        bestAccuracy: num(v.bestAccuracy, 0, 0, 100),
      };
    }
  }

  if (isObj(raw.totals)) {
    const t = raw.totals;
    d.totals = {
      sessions: Math.floor(num(t.sessions, 0, 0)),
      seconds: num(t.seconds, 0, 0),
      chars: num(t.chars, 0, 0),
      correctChars: num(t.correctChars, 0, 0),
      perfectRuns: Math.floor(num(t.perfectRuns, 0, 0)),
      maxCombo: Math.floor(num(t.maxCombo, 0, 0)),
      zenSeconds: num(t.zenSeconds, 0, 0),
      keyStats: {},
    };
    if (isObj(t.keyStats)) {
      for (const [k, v] of Object.entries(t.keyStats)) {
        if (k.length === 1 && isObj(v)) {
          d.totals.keyStats[k] = { hits: num(v.hits, 0, 0), errors: num(v.errors, 0, 0), ms: num(v.ms, 0, 0) };
        }
      }
    }
  }

  if (isObj(raw.minutesByDate)) {
    for (const [date, m] of Object.entries(raw.minutesByDate)) {
      if (isValidDateStr(date) && typeof m === 'number' && Number.isFinite(m)) d.minutesByDate[date] = m;
    }
  }

  if (isObj(raw.drafts)) {
    const list: Draft[] = [];
    for (const [key, v] of Object.entries(raw.drafts)) {
      const dr = cleanDraft(key, v);
      if (dr) list.push(dr);
    }
    list.sort((a, b) => b.savedAt - a.savedAt);
    for (const dr of list.slice(0, MAX_DRAFTS)) d.drafts[dr.key] = dr;
  }

  return d;
}
