import type { Session } from '../types';

export type BadgeIcon =
  | 'sparkles' | 'gauge' | 'flame' | 'target' | 'book' | 'graduation' | 'trophy' | 'moon' | 'sun'
  | 'zap' | 'crown' | 'star' | 'leaf' | 'keyboard' | 'calendar' | 'library' | 'rocket';

export interface BadgeDef {
  id: string;
  title: string;
  description: string;
  icon: BadgeIcon;
  /** 1 bronze, 2 silver, 3 gold — purely cosmetic */
  tier: 1 | 2 | 3;
}

export interface BadgeCtx {
  session: Session;
  sessions: number;
  totalWords: number;
  bestWpm: number;
  streak: number;
  longestStreak: number;
  level: number;
  chaptersDone: number;
  booksDone: number;
  lessonsPassed: number;
  lessonsTotal: number;
  homeRowDone: boolean;
  challengesDone: number;
  maxCombo: number;
  perfectRun: boolean;
  zenSeconds: number;
  hour: number;
}

interface Def extends BadgeDef {
  check: (c: BadgeCtx) => boolean;
}

const DEFS: Def[] = [
  { id: 'first-steps', title: 'First Steps', description: 'Complete your first session.', icon: 'sparkles', tier: 1, check: (c) => c.sessions >= 1 },
  { id: 'wpm-30', title: 'Warming Up', description: 'Reach 30 WPM.', icon: 'gauge', tier: 1, check: (c) => c.bestWpm >= 30 },
  { id: 'wpm-40', title: 'Steady Hands', description: 'Reach 40 WPM.', icon: 'gauge', tier: 1, check: (c) => c.bestWpm >= 40 },
  { id: 'wpm-60', title: 'First 60 WPM', description: 'Reach 60 WPM.', icon: 'gauge', tier: 2, check: (c) => c.bestWpm >= 60 },
  { id: 'wpm-80', title: 'Speedster', description: 'Reach 80 WPM.', icon: 'zap', tier: 2, check: (c) => c.bestWpm >= 80 },
  { id: 'wpm-100', title: 'Triple Digits', description: 'Reach 100 WPM.', icon: 'rocket', tier: 3, check: (c) => c.bestWpm >= 100 },
  { id: 'streak-3', title: 'Getting Going', description: 'Keep a 3-day streak.', icon: 'flame', tier: 1, check: (c) => c.longestStreak >= 3 },
  { id: 'streak-7', title: '7-Day Streak', description: 'Keep a 7-day streak.', icon: 'flame', tier: 2, check: (c) => c.longestStreak >= 7 },
  { id: 'streak-14', title: 'Fortnight of Flow', description: 'Keep a 14-day streak.', icon: 'flame', tier: 2, check: (c) => c.longestStreak >= 14 },
  { id: 'streak-30', title: 'Month of Flow', description: 'Keep a 30-day streak.', icon: 'flame', tier: 3, check: (c) => c.longestStreak >= 30 },
  { id: 'streak-100', title: 'Centurion', description: 'Keep a 100-day streak.', icon: 'crown', tier: 3, check: (c) => c.longestStreak >= 100 },
  { id: 'perfect-run', title: 'Perfect Run', description: 'Finish a session with 100% accuracy.', icon: 'target', tier: 2, check: (c) => c.perfectRun },
  { id: 'words-1k', title: '1,000 Words', description: 'Type 1,000 words in total.', icon: 'keyboard', tier: 1, check: (c) => c.totalWords >= 1000 },
  { id: 'words-10k', title: '10k Words', description: 'Type 10,000 words in total.', icon: 'keyboard', tier: 3, check: (c) => c.totalWords >= 10000 },
  { id: 'sessions-25', title: 'Regular', description: 'Complete 25 sessions.', icon: 'calendar', tier: 1, check: (c) => c.sessions >= 25 },
  { id: 'sessions-100', title: 'Committed', description: 'Complete 100 sessions.', icon: 'calendar', tier: 3, check: (c) => c.sessions >= 100 },
  { id: 'night-owl', title: 'Night Owl', description: 'Practise between midnight and 5am.', icon: 'moon', tier: 1, check: (c) => c.hour >= 0 && c.hour < 5 },
  { id: 'early-bird', title: 'Early Bird', description: 'Practise between 5am and 8am.', icon: 'sun', tier: 1, check: (c) => c.hour >= 5 && c.hour < 8 },
  { id: 'combo-100', title: 'Combo King', description: 'Hit a 100-character combo.', icon: 'zap', tier: 2, check: (c) => c.maxCombo >= 100 },
  { id: 'first-chapter', title: 'Bookworm', description: 'Finish your first story chapter.', icon: 'book', tier: 1, check: (c) => c.chaptersDone >= 1 },
  { id: 'book-done', title: 'Cover to Cover', description: 'Finish a whole book.', icon: 'book', tier: 2, check: (c) => c.booksDone >= 1 },
  { id: 'librarian', title: 'Librarian', description: 'Finish 3 books.', icon: 'library', tier: 3, check: (c) => c.booksDone >= 3 },
  { id: 'first-lesson', title: 'Student', description: 'Pass your first lesson.', icon: 'graduation', tier: 1, check: (c) => c.lessonsPassed >= 1 },
  { id: 'home-row', title: 'Home Row Hero', description: 'Pass every home-row lesson.', icon: 'keyboard', tier: 2, check: (c) => c.homeRowDone },
  { id: 'touch-typist', title: 'Touch Typist', description: 'Pass every lesson.', icon: 'graduation', tier: 3, check: (c) => c.lessonsTotal > 0 && c.lessonsPassed >= c.lessonsTotal },
  { id: 'challenge-1', title: 'Daily Driver', description: 'Complete a daily challenge.', icon: 'trophy', tier: 1, check: (c) => c.challengesDone >= 1 },
  { id: 'challenge-7', title: 'Challenger', description: 'Complete 7 daily challenges.', icon: 'trophy', tier: 2, check: (c) => c.challengesDone >= 7 },
  { id: 'level-5', title: 'Rising Star', description: 'Reach level 5.', icon: 'star', tier: 1, check: (c) => c.level >= 5 },
  { id: 'level-10', title: 'Veteran', description: 'Reach level 10.', icon: 'star', tier: 3, check: (c) => c.level >= 10 },
  { id: 'zen-master', title: 'Zen Master', description: 'Spend 5 minutes in Zen mode.', icon: 'leaf', tier: 2, check: (c) => c.zenSeconds >= 300 },
  { id: 'sharp-shooter', title: 'Sharp Shooter', description: '98%+ accuracy over 100+ keystrokes.', icon: 'target', tier: 2, check: (c) => c.session.accuracy >= 98 && c.session.charsTyped >= 100 },
];

export const BADGES: BadgeDef[] = DEFS.map(({ check: _check, ...rest }) => rest);

export function badgeById(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}

/** Ids of badges whose condition is met but that aren't unlocked yet. */
export function evaluateBadges(ctx: BadgeCtx, unlocked: Record<string, number>): string[] {
  return DEFS.filter((d) => !(d.id in unlocked) && d.check(ctx)).map((d) => d.id);
}
