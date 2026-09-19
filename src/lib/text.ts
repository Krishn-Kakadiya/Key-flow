import { EASY_WORDS, MEDIUM_WORDS, HARD_WORDS, ALL_WORDS } from '../data/words';
import { QUOTES, ZEN_PASSAGES, type Quote } from '../data/quotes';
import { SNIPPETS, type CodeLang, type Snippet } from '../data/code';
import { pick, type Rng } from './rng';
import type { KeyStat } from '../types';

export type Difficulty = 'mixed' | 'easy' | 'hard';

export function wordPool(d: Difficulty): string[] {
  if (d === 'easy') return EASY_WORDS;
  if (d === 'hard') return [...MEDIUM_WORDS, ...HARD_WORDS];
  return [...EASY_WORDS, ...MEDIUM_WORDS];
}

export interface WordOpts {
  difficulty?: Difficulty;
  punctuation?: boolean;
  numbers?: boolean;
  pool?: string[];
}

function pickNoRepeat(pool: readonly string[], prev: string | undefined, rng: Rng): string {
  for (let i = 0; i < 6; i++) {
    const w = pick(pool, rng);
    if (w !== prev) return w;
  }
  return pick(pool, rng);
}

/** Random words, optionally with sentence punctuation and numbers sprinkled in. */
export function generateWords(n: number, rng: Rng, opts: WordOpts = {}): string {
  const pool = opts.pool ?? wordPool(opts.difficulty ?? 'mixed');
  const words: string[] = [];
  let sentenceLeft = 0;
  for (let i = 0; i < n; i++) {
    let w: string;
    if (opts.numbers && rng() < 0.12) {
      const len = 1 + Math.floor(rng() * 4);
      w = Array.from({ length: len }, () => Math.floor(rng() * 10)).join('');
    } else {
      w = pickNoRepeat(pool, words[words.length - 1], rng);
    }
    if (opts.punctuation) {
      if (sentenceLeft <= 0) {
        sentenceLeft = 5 + Math.floor(rng() * 7);
        if (!/^\d/.test(w)) w = w[0].toUpperCase() + w.slice(1);
      }
      sentenceLeft--;
      if (sentenceLeft === 0 || i === n - 1) {
        w += pick(['.', '.', '.', '?', '!'], rng);
      } else if (rng() < 0.1) {
        w += ',';
      } else if (rng() < 0.03) {
        w = `"${w}"`;
      }
    }
    words.push(w);
  }
  return words.join(' ');
}

export function quoteFor(length: 'short' | 'medium' | 'long', rng: Rng): Quote {
  return pick(QUOTES[length], rng);
}

export function codeSnippet(lang: CodeLang | 'any', rng: Rng): Snippet {
  const pool = lang === 'any' ? SNIPPETS : SNIPPETS.filter((s) => s.lang === lang);
  return pick(pool.length ? pool : SNIPPETS, rng);
}

export function zenPassage(rng: Rng): string {
  return pick(ZEN_PASSAGES, rng);
}

/* ───────────── weak-key analysis ───────────── */

export interface KeyWeakness {
  key: string;
  score: number;
  errorRate: number;
  avgMs: number;
  hits: number;
}

const MIN_HITS = 6;

/** Rank letters by how much they slow you down or trip you up. */
export function rankWeakKeys(stats: Record<string, KeyStat>): KeyWeakness[] {
  const letters = Object.entries(stats).filter(([k, v]) => /^[a-z]$/.test(k) && v.hits >= MIN_HITS);
  if (!letters.length) return [];
  const timed = letters.filter(([, v]) => v.hits - v.errors > 0 && v.ms > 0);
  const globalAvg = timed.length
    ? timed.reduce((a, [, v]) => a + v.ms / Math.max(1, v.hits - v.errors), 0) / timed.length
    : 0;
  return letters
    .map(([key, v]) => {
      const errorRate = v.errors / v.hits;
      const avgMs = v.ms / Math.max(1, v.hits - v.errors);
      const slow = globalAvg ? Math.max(0, avgMs / globalAvg - 1) : 0;
      return { key, errorRate, avgMs, hits: v.hits, score: errorRate * 5 + slow };
    })
    .filter((k) => k.score > 0)
    .sort((a, b) => b.score - a.score);
}

const FALLBACK_KEYS = ['q', 'z', 'x', 'j', 'v', 'k', 'b', 'w', 'p', 'y'];

export function weakKeyTargets(stats: Record<string, KeyStat>, count = 5): { keys: string[]; personalised: boolean } {
  const ranked = rankWeakKeys(stats).slice(0, count).map((k) => k.key);
  if (ranked.length >= 3) return { keys: ranked, personalised: true };
  const keys = [...ranked];
  for (const f of FALLBACK_KEYS) {
    if (keys.length >= count) break;
    if (!keys.includes(f)) keys.push(f);
  }
  return { keys, personalised: ranked.length > 0 };
}

/** Adaptive drill: words weighted toward the user's weakest keys. */
export function weakKeyText(stats: Record<string, KeyStat>, n: number, rng: Rng): { text: string; keys: string[]; personalised: boolean } {
  const { keys, personalised } = weakKeyTargets(stats);
  const weight = new Map(keys.map((k, i) => [k, keys.length - i]));
  const scored = ALL_WORDS.filter((w) => w.length <= 9)
    .map((w) => {
      let s = 0;
      for (const c of w) s += weight.get(c) ?? 0;
      return { w, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 160)
    .map((x) => x.w);
  const pool = scored.length >= 10 ? scored : ALL_WORDS;
  const words: string[] = [];
  for (let i = 0; i < n; i++) words.push(pickNoRepeat(pool, words[words.length - 1], rng));
  return { text: words.join(' '), keys, personalised };
}
