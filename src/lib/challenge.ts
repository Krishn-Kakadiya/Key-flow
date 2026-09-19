import { dayIndex } from './date';
import { seeded, pick } from './rng';
import { generateWords, quoteFor, codeSnippet, weakKeyText } from './text';
import type { KeyStat } from '../types';

export type ChallengeType = 'sprint' | 'accuracy' | 'endurance' | 'weakkey' | 'themed';
export type ChallengeTheme = 'quotes' | 'code' | 'numbers';

export interface ChallengeDef {
  date: string;
  type: ChallengeType;
  theme?: ChallengeTheme;
  title: string;
  description: string;
  goal: string;
  timeLimit?: number;
  minAccuracy: number;
  icon: 'zap' | 'target' | 'timer' | 'crosshair' | 'sparkles';
}

const ORDER: ChallengeType[] = ['sprint', 'accuracy', 'endurance', 'weakkey', 'themed'];
const THEMES: ChallengeTheme[] = ['quotes', 'code', 'numbers'];

/** Same challenge for everyone on a given local date. */
export function challengeFor(date: string): ChallengeDef {
  const idx = dayIndex(date);
  const type = ORDER[((idx % 5) + 5) % 5];
  switch (type) {
    case 'sprint':
      return { date, type, title: 'Speed Sprint', description: '30 seconds. Type as fast as you can while staying clean.', goal: 'Finish with 85%+ accuracy', timeLimit: 30, minAccuracy: 85, icon: 'zap' };
    case 'accuracy':
      return { date, type, title: 'Accuracy Hunt', description: '40 words. Slow down, be precise, hit the target.', goal: 'Reach 98%+ accuracy', minAccuracy: 98, icon: 'target' };
    case 'endurance':
      return { date, type, title: 'Endurance', description: 'Two full minutes. Find a rhythm and hold it.', goal: 'Finish with 90%+ accuracy', timeLimit: 120, minAccuracy: 90, icon: 'timer' };
    case 'weakkey':
      return { date, type, title: 'Weak-Key Drill', description: 'Words built around the keys that slow you down the most.', goal: 'Finish with 90%+ accuracy', minAccuracy: 90, icon: 'crosshair' };
    default: {
      const theme = THEMES[Math.floor(idx / 5) % THEMES.length];
      const label = theme === 'quotes' ? 'Famous Quotes' : theme === 'code' ? 'Code Snippet' : 'Numbers & Words';
      return { date, type, theme, title: `Themed: ${label}`, description: `A special text set: ${label.toLowerCase()}.`, goal: 'Finish with 90%+ accuracy', minAccuracy: 90, icon: 'sparkles' };
    }
  }
}

export function challengeGoalMet(ctype: string, accuracy: number): boolean {
  const min = ctype === 'accuracy' ? 98 : ctype === 'sprint' ? 85 : 90;
  return accuracy >= min;
}

export interface ChallengeSpec {
  text: string;
  timeLimit?: number;
  autoIndent?: boolean;
  note?: string;
}

/** Build the text for a challenge; deterministic per date (weak-key uses the user's own stats). */
export function challengeSpec(def: ChallengeDef, stats: Record<string, KeyStat>): ChallengeSpec {
  const rng = seeded(`keyflow-${def.date}`);
  switch (def.type) {
    case 'sprint':
      return { text: generateWords(120, rng, { difficulty: 'mixed' }), timeLimit: 30 };
    case 'accuracy':
      return { text: generateWords(40, rng, { difficulty: 'mixed' }) };
    case 'endurance':
      return { text: generateWords(400, rng, { difficulty: 'mixed', punctuation: true }), timeLimit: 120 };
    case 'weakkey': {
      const w = weakKeyText(stats, 45, rng);
      return {
        text: w.text,
        note: `Targeting: ${w.keys.map((k) => k.toUpperCase()).join(' ')}${w.personalised ? '' : ' (warm-up set - play more to personalise)'}`,
      };
    }
    default:
      if (def.theme === 'quotes') {
        const a = quoteFor('medium', rng);
        const b = quoteFor('short', rng);
        return { text: `${a.text} ${b.text}` };
      }
      if (def.theme === 'code') {
        return { text: codeSnippet('any', rng).code, autoIndent: true };
      }
      return { text: numbersAndWords(rng) };
  }
}

function numbersAndWords(rng: () => number): string {
  const nouns = ['tickets', 'apples', 'miles', 'items', 'boxes', 'people', 'dollars', 'seats', 'pages', 'steps'];
  const parts: string[] = [];
  for (let i = 0; i < 9; i++) {
    const n = Math.floor(rng() * 9000) + 10;
    parts.push(`${n} ${pick(nouns, rng)}`);
  }
  return parts.join(', ') + '.';
}
