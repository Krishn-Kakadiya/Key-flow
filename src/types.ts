import type { Streak } from './lib/progress';
import type { CodeLang } from './data/code';

export type Mode =
  | 'time'
  | 'words'
  | 'quote'
  | 'zen'
  | 'custom'
  | 'code'
  | 'lesson'
  | 'story'
  | 'challenge';

export type SessionRef =
  | { type: 'story'; storyId: string; chapter: number }
  | { type: 'lesson'; lessonId: string }
  | { type: 'challenge'; date: string; ctype: string };

export interface Session {
  id: string;
  timestamp: number;
  mode: Mode;
  /** finer-grained key used for personal records, e.g. "time-30" */
  modeKey: string;
  durationSec: number;
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  consistency: number;
  charsTyped: number;
  errors: number;
  wpmSeries: number[];
  seriesStep: number;
  keyErrors: Record<string, number>;
  ref?: SessionRef;
  tag?: 'baseline';
}

export interface Profile {
  id: string;
  createdAt: number;
  baselineWpm: number | null;
  onboarded: boolean;
  xp: number;
  /** XP spent on streak freezes (level is based on lifetime XP, never reduced) */
  spentXp: number;
  dailyGoalMinutes: number;
  streakFreezes: number;
}

export type ReducedMotion = 'system' | 'on' | 'off';

export interface Settings {
  theme: string;
  sound: boolean;
  volume: number;
  fontSize: number;
  reducedMotion: ReducedMotion;
  noPeeking: boolean;
  unlockAllLessons: boolean;
  hideMobileHint: boolean;
}

export type PracticeMode = 'time' | 'words' | 'quote' | 'zen' | 'custom' | 'code' | 'weak';

export interface Prefs {
  mode: PracticeMode;
  time: number;
  words: number;
  quote: 'short' | 'medium' | 'long';
  punctuation: boolean;
  numbers: boolean;
  difficulty: 'mixed' | 'easy' | 'hard';
  ghost: boolean;
  codeLang: CodeLang | 'any';
  customText: string;
}

export interface KeyStat {
  hits: number;
  errors: number;
  ms: number;
}

export interface Totals {
  sessions: number;
  seconds: number;
  chars: number;
  correctChars: number;
  perfectRuns: number;
  maxCombo: number;
  zenSeconds: number;
  keyStats: Record<string, KeyStat>;
}

export interface Ghost {
  wpm: number;
  cum: number[];
  step: number;
}

export interface Records {
  bestWpmByMode: Record<string, number>;
  ghosts: Record<string, Ghost>;
}

export interface StoryProgress {
  storyId: string;
  completedChapters: number[];
  stats: Record<number, { wpm: number; accuracy: number }>;
  lastPlayed: number;
  completedAt: number | null;
}

export interface LessonProgress {
  lessonId: string;
  passed: boolean;
  bestAccuracy: number;
  bestWpm: number;
  stars: number;
  attempts: number;
}

export interface ChallengeRecord {
  date: string;
  type: string;
  completed: boolean;
  attempts: number;
  bestWpm: number;
  bestAccuracy: number;
}

/** Everything that gets persisted / exported. */
export interface Data {
  profile: Profile;
  settings: Settings;
  prefs: Prefs;
  streak: Streak;
  sessions: Session[];
  records: Records;
  badges: Record<string, number>;
  stories: Record<string, StoryProgress>;
  lessons: Record<string, LessonProgress>;
  challenges: Record<string, ChallengeRecord>;
  totals: Totals;
  minutesByDate: Record<string, number>;
}

export interface Reward {
  counted: boolean;
  xp: number;
  xpLines: { label: string; xp: number }[];
  levelBefore: number;
  levelAfter: number;
  xpBefore: number;
  xpAfter: number;
  isPB: boolean;
  isFirstRecord: boolean;
  previousBest: number;
  streakBefore: number;
  streakAfter: number;
  streakIncremented: boolean;
  streakRestarted: boolean;
  streakMilestone: number | null;
  freezesUsed: number;
  freezeEarned: boolean;
  newBadges: string[];
  bookCompleted: boolean;
  chapterUnlocked: boolean;
  lessonPassed: boolean;
  lessonStars: number;
  challengeCompleted: boolean;
  challengeGoalMet: boolean;
  newThemes: string[];
  dailyMinutes: number;
}
