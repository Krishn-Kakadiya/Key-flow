/**
 * Keyflow typing engine — pure functions, no DOM, no React.
 *
 * Every state transition takes the previous state plus a timestamp (ms on an
 * "active clock" the caller controls, so pausing is the caller's business) and
 * returns a new state. All modes (time, words, quotes, stories, lessons,
 * challenges…) sit on top of this.
 *
 * Scoring model
 *  - Typing is position-locked: the character typed at index i is compared to
 *    target[i]. A wrong key is marked wrong and the caret still advances;
 *    Backspace steps back and lets you fix it.
 *  - Accuracy  = correct keystrokes / total keystrokes (backspaces excluded).
 *  - Raw WPM   = (chars typed / 5) / minutes
 *  - Net WPM   = (chars currently correct / 5) / minutes
 */

export interface Ev {
  /** ms since the first keystroke */
  t: number;
  /** 'k' = character typed, 'b' = backspace */
  k: 'k' | 'b';
  ok?: boolean;
  /** number of characters removed (backspace) */
  n?: number;
  /** number of auto-filled indentation chars appended after this key */
  auto?: number;
}

export interface WordMark {
  endIdx: number;
  t: number;
  chars: number;
}

export interface EngineState {
  target: string;
  typed: string;
  /** active-clock time of the first keystroke; null until the user starts */
  startedAt: number | null;
  events: Ev[];
  keystrokes: number;
  correctKeystrokes: number;
  /** wrong keystrokes made (even if later corrected) */
  errors: number;
  /** currently-correct characters in `typed` */
  correct: number;
  combo: number;
  maxCombo: number;
  keyErrors: Record<string, number>;
  keyHits: Record<string, number>;
  keyMs: Record<string, number>;
  lastKeyT: number | null;
  words: WordMark[];
  autoRanges: Array<[number, number]>;
  endOnComplete: boolean;
  autoIndent: boolean;
  /** ms since start at which the text was completed */
  finishedAt: number | null;
}

export interface EngineOptions {
  endOnComplete?: boolean;
  autoIndent?: boolean;
}

export function createEngine(target: string, opts: EngineOptions = {}): EngineState {
  return {
    target,
    typed: '',
    startedAt: null,
    events: [],
    keystrokes: 0,
    correctKeystrokes: 0,
    errors: 0,
    correct: 0,
    combo: 0,
    maxCombo: 0,
    keyErrors: {},
    keyHits: {},
    keyMs: {},
    lastKeyT: null,
    words: [],
    autoRanges: [],
    endOnComplete: opts.endOnComplete ?? true,
    autoIndent: opts.autoIndent ?? false,
    finishedAt: null,
  };
}

const isSpace = (c: string) => c === ' ' || c === '\n';

export function isStarted(s: EngineState): boolean {
  return s.startedAt !== null;
}

export function isFinished(s: EngineState): boolean {
  return s.finishedAt !== null;
}

export function extendTarget(s: EngineState, more: string): EngineState {
  if (!more) return s;
  return { ...s, target: s.target + more };
}

export function typeChar(s: EngineState, ch: string, now: number): EngineState {
  if (s.finishedAt !== null) return s;
  const i = s.typed.length;
  if (i >= s.target.length) return s;
  const exp = s.target[i];
  // A stray Enter in the middle of prose is ignored rather than punished.
  if (ch === '\n' && exp !== '\n') return s;

  const startedAt = s.startedAt ?? now;
  const t = Math.max(0, now - startedAt);
  const ok = ch === exp;
  const key = exp.toLowerCase();

  const keyHits = { ...s.keyHits, [key]: (s.keyHits[key] ?? 0) + 1 };
  let keyErrors = s.keyErrors;
  let keyMs = s.keyMs;
  let errors = s.errors;
  let combo = s.combo;
  if (ok) {
    combo += 1;
    if (s.lastKeyT !== null) {
      const dt = Math.min(t - s.lastKeyT, 2000);
      keyMs = { ...keyMs, [key]: (keyMs[key] ?? 0) + Math.max(0, dt) };
    }
  } else {
    errors += 1;
    combo = 0;
    keyErrors = { ...keyErrors, [key]: (keyErrors[key] ?? 0) + 1 };
  }

  let typed = s.typed + ch;
  let correct = s.correct + (ok ? 1 : 0);
  const autoRanges = s.autoRanges;
  let nextRanges = autoRanges;
  let auto = 0;
  if (ok && ch === '\n' && s.autoIndent) {
    let j = i + 1;
    while (j < s.target.length && s.target[j] === ' ') j++;
    auto = j - (i + 1);
    if (auto > 0) {
      typed += s.target.slice(i + 1, j);
      correct += auto;
      nextRanges = [...autoRanges, [i + 1, j]];
    }
  }

  let words = s.words;
  if (isSpace(exp) || i + 1 === s.target.length) {
    const prevEnd = words.length ? words[words.length - 1].endIdx : 0;
    words = [...words, { endIdx: i + 1, t, chars: i + 1 - prevEnd }];
  }

  const finishedAt = s.endOnComplete && typed.length >= s.target.length ? t : null;

  return {
    ...s,
    typed,
    startedAt,
    events: s.events.concat(auto ? { t, k: 'k', ok, auto } : { t, k: 'k', ok }),
    keystrokes: s.keystrokes + 1,
    correctKeystrokes: s.correctKeystrokes + (ok ? 1 : 0),
    errors,
    correct,
    combo,
    maxCombo: Math.max(s.maxCombo, combo),
    keyHits,
    keyErrors,
    keyMs,
    lastKeyT: t,
    words,
    autoRanges: nextRanges,
    finishedAt,
  };
}

export function backspace(s: EngineState, now: number, wholeWord = false): EngineState {
  if (s.finishedAt !== null || s.startedAt === null || s.typed.length === 0) return s;
  const len = s.typed.length;
  let newLen = len - 1;
  const last = s.autoRanges[s.autoRanges.length - 1];
  if (last && last[1] === len) {
    newLen = last[0];
  } else if (wholeWord) {
    let j = len;
    while (j > 0 && isSpace(s.typed[j - 1])) j--;
    while (j > 0 && !isSpace(s.typed[j - 1])) j--;
    newLen = j;
  }
  let removedCorrect = 0;
  for (let i = newLen; i < len; i++) if (s.typed[i] === s.target[i]) removedCorrect++;

  return {
    ...s,
    typed: s.typed.slice(0, newLen),
    correct: s.correct - removedCorrect,
    events: s.events.concat({ t: Math.max(0, now - s.startedAt), k: 'b', n: len - newLen }),
    words: s.words.filter((w) => w.endIdx <= newLen),
    autoRanges: s.autoRanges.filter((r) => r[1] <= newLen),
  };
}

export function elapsedMs(s: EngineState, now: number): number {
  return s.startedAt === null ? 0 : Math.max(0, now - s.startedAt);
}

export interface LiveMetrics {
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  errors: number;
  elapsedMs: number;
}

/** Minimum window used for WPM maths so the first keystrokes don't spike. */
const MIN_WINDOW_MS = 1000;

export function liveMetrics(s: EngineState, elapsed: number): LiveMetrics {
  const minutes = Math.max(elapsed, MIN_WINDOW_MS) / 60000;
  return {
    rawWpm: s.typed.length / 5 / minutes,
    netWpm: s.correct / 5 / minutes,
    accuracy: s.keystrokes === 0 ? 100 : (s.correctKeystrokes / s.keystrokes) * 100,
    errors: s.errors,
    elapsedMs: elapsed,
  };
}

/** Comfort curve: 100 when every word takes equal time, → 0 as the spread explodes. */
export function consistencyFromWords(wordWpms: number[]): number {
  if (wordWpms.length < 3) return 100;
  const mean = wordWpms.reduce((a, b) => a + b, 0) / wordWpms.length;
  if (mean <= 0) return 0;
  const variance = wordWpms.reduce((a, b) => a + (b - mean) ** 2, 0) / wordWpms.length;
  const cv = Math.sqrt(variance) / mean;
  return Math.max(0, Math.min(100, 100 * (1 - Math.tanh(cv + cv ** 3 / 3 + cv ** 5 / 5))));
}

export interface EngineResult {
  durationSec: number;
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  consistency: number;
  charsTyped: number;
  correctChars: number;
  errors: number;
  keystrokes: number;
  maxCombo: number;
  /** trailing-window net WPM sampled every `seriesStep` seconds */
  wpmSeries: number[];
  /** cumulative correct characters sampled every `seriesStep` seconds (powers the ghost) */
  cumChars: number[];
  seriesStep: number;
  keyErrors: Record<string, number>;
  keyHits: Record<string, number>;
  keyMs: Record<string, number>;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Replay the event log to get cumulative correct chars at each whole second. */
export function correctAtSeconds(events: Ev[], totalMs: number): number[] {
  const okAt: boolean[] = [];
  let correct = 0;
  const snaps: number[] = [];
  let boundary = 1000;
  for (const ev of events) {
    if (ev.t > totalMs) break;
    while (boundary <= ev.t) {
      snaps.push(correct);
      boundary += 1000;
    }
    if (ev.k === 'k') {
      okAt.push(!!ev.ok);
      if (ev.ok) correct++;
      if (ev.auto) {
        for (let a = 0; a < ev.auto; a++) okAt.push(true);
        correct += ev.auto;
      }
    } else {
      for (let n = 0; n < (ev.n ?? 1); n++) {
        if (okAt.pop()) correct--;
      }
    }
  }
  while (boundary <= totalMs) {
    snaps.push(correct);
    boundary += 1000;
  }
  return snaps;
}

export function finalize(s: EngineState, durationMs: number): EngineResult {
  const dur = Math.max(durationMs, 1);
  const minutes = Math.max(dur, MIN_WINDOW_MS) / 60000;
  const snaps = correctAtSeconds(s.events, dur);

  const step = Math.max(1, Math.ceil(snaps.length / 240));
  const wpmSeries: number[] = [];
  const cumChars: number[] = [];
  const WINDOW = 5;
  for (let sec = step; sec <= snaps.length; sec += step) {
    const now = snaps[sec - 1];
    const back = Math.max(0, sec - WINDOW);
    const before = back === 0 ? 0 : snaps[back - 1];
    const winSec = sec - back;
    wpmSeries.push(round1(Math.max(0, (now - before) / 5 / (winSec / 60))));
    cumChars.push(now);
  }

  const wordWpms: number[] = [];
  let prevT = 0;
  for (const w of s.words) {
    const dt = w.t - prevT;
    if (dt > 0) wordWpms.push(w.chars / 5 / (dt / 60000));
    prevT = w.t;
  }

  return {
    durationSec: round1(dur / 1000),
    rawWpm: round1(s.typed.length / 5 / minutes),
    netWpm: round1(s.correct / 5 / minutes),
    accuracy: s.keystrokes === 0 ? 0 : round1((s.correctKeystrokes / s.keystrokes) * 100),
    consistency: Math.round(consistencyFromWords(wordWpms)),
    charsTyped: s.typed.length,
    correctChars: s.correct,
    errors: s.errors,
    keystrokes: s.keystrokes,
    maxCombo: s.maxCombo,
    wpmSeries,
    cumChars,
    seriesStep: step,
    keyErrors: s.keyErrors,
    keyHits: s.keyHits,
    keyMs: s.keyMs,
  };
}

/** Correct-character count of a recorded run at time `tMs` (linear interpolation) — used by the ghost. */
export function ghostChars(cum: number[], step: number, tMs: number): number {
  if (!cum.length || tMs <= 0) return 0;
  const pos = tMs / (step * 1000);
  const idx = Math.floor(pos);
  if (idx >= cum.length) return cum[cum.length - 1];
  const a = idx === 0 ? 0 : cum[idx - 1];
  const b = cum[idx];
  return a + (b - a) * (pos - idx);
}

/**
 * Clean pasted / user-supplied text so it can actually be typed on a keyboard:
 * curly quotes → straight, dashes → hyphen, NBSP → space, tabs → spaces.
 */
export function normalizeText(raw: string, opts: { keepNewlines?: boolean } = {}): string {
  let t = raw
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/…/g, '...')
    .replace(/[   ]/g, ' ')
    .replace(/\r\n?/g, '\n')
    .replace(/\t/g, '  ');
  // Drop zero-width and other control characters (keep \n).
  // eslint-disable-next-line no-control-regex
  t = t.replace(/[ -	-​-‍﻿]/g, '');
  if (opts.keepNewlines) {
    t = t
      .split('\n')
      .map((l) => l.replace(/[ ]+$/g, ''))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  } else {
    t = t.replace(/\s+/g, ' ');
  }
  return t.trim();
}
