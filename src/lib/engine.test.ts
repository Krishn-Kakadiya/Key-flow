import { describe, expect, it } from 'vitest';
import {
  backspace, createEngine, finalize, liveMetrics, typeChar, normalizeText, ghostChars, consistencyFromWords, extendTarget,
  snapshot, restoreEngine,
  type EngineState,
} from './engine';

/** type a string, `gap` ms between keys, starting at t0 */
function typeStr(s: EngineState, str: string, t0 = 1000, gap = 100): EngineState {
  let t = t0;
  for (const ch of str) {
    s = typeChar(s, ch, t);
    t += gap;
  }
  return s;
}

describe('typing engine', () => {
  it('a perfect run is 100% accurate and finishes on the last char', () => {
    const s = typeStr(createEngine('hello world'), 'hello world');
    expect(s.finishedAt).not.toBeNull();
    const r = finalize(s, s.finishedAt!);
    expect(r.accuracy).toBe(100);
    expect(r.errors).toBe(0);
    expect(r.correctChars).toBe(11);
  });

  it('an all-wrong run is 0% (never NaN/Infinity)', () => {
    const s = typeStr(createEngine('aaaa'), 'bbbb');
    const r = finalize(s, s.finishedAt!);
    expect(r.accuracy).toBe(0);
    expect(r.netWpm).toBe(0);
    for (const v of [r.rawWpm, r.netWpm, r.accuracy, r.consistency]) expect(Number.isFinite(v)).toBe(true);
  });

  it('no keystrokes → no NaN in live metrics', () => {
    const m = liveMetrics(createEngine('abc'), 0);
    expect(m.accuracy).toBe(100);
    expect(m.netWpm).toBe(0);
  });

  it('timer starts on the first keystroke, not on creation', () => {
    const s = createEngine('abc');
    expect(s.startedAt).toBeNull();
    const s2 = typeChar(s, 'a', 5000);
    expect(s2.startedAt).toBe(5000);
  });

  it('WPM follows (correct/5)/minutes', () => {
    // 50 chars in exactly 60s window => 10 WPM
    const target = 'a'.repeat(50);
    let s = createEngine(target);
    for (let i = 0; i < 50; i++) s = typeChar(s, 'a', 1000 + i * (60000 / 49));
    const r = finalize(s, 60000);
    expect(r.netWpm).toBeCloseTo(10, 1);
    expect(r.rawWpm).toBeCloseTo(10, 1);
  });

  it('net WPM penalises uncorrected errors, raw does not', () => {
    let s = createEngine('a'.repeat(50), { endOnComplete: false });
    for (let i = 0; i < 40; i++) s = typeChar(s, i % 2 ? 'a' : 'b', 1000 + i * 100);
    const r = finalize(s, 60000);
    expect(r.rawWpm).toBeCloseTo(8, 1);
    expect(r.netWpm).toBeCloseTo(4, 1);
  });

  it('backspace corrects the previous char and its state', () => {
    let s = createEngine('cat');
    s = typeChar(s, 'c', 0);
    s = typeChar(s, 'x', 100);
    expect(s.correct).toBe(1);
    s = backspace(s, 200);
    expect(s.typed).toBe('c');
    s = typeChar(s, 'a', 300);
    s = typeChar(s, 't', 400);
    expect(s.finishedAt).not.toBeNull();
    // the earlier mistake still counts against accuracy (3 correct of 4 keystrokes)
    expect(finalize(s, 400).accuracy).toBe(75);
    expect(s.errors).toBe(1);
  });

  it('backspace before start / on empty is a no-op', () => {
    const s = createEngine('abc');
    expect(backspace(s, 0)).toBe(s);
    const s2 = typeChar(s, 'a', 0);
    const s3 = backspace(backspace(s2, 10), 20);
    expect(s3.typed).toBe('');
  });

  it('typing past the end does not crash or change state', () => {
    const s = typeStr(createEngine('hi'), 'hi');
    const after = typeChar(s, 'x', 9999);
    expect(after).toBe(s);
    const open = typeStr(createEngine('hi', { endOnComplete: false }), 'hi');
    expect(typeChar(open, 'x', 9999).typed).toBe('hi');
  });

  it('ctrl+backspace deletes a whole word', () => {
    let s = typeStr(createEngine('hello brave world', { endOnComplete: false }), 'hello brav');
    s = backspace(s, 5000, true);
    expect(s.typed).toBe('hello ');
    s = backspace(s, 5100, true);
    expect(s.typed).toBe('');
  });

  it('stray Enter is ignored unless a newline is expected', () => {
    const s = createEngine('ab');
    expect(typeChar(s, '\n', 0)).toBe(s);
    const code = typeStr(createEngine('a\nb'), 'a\nb');
    expect(code.finishedAt).not.toBeNull();
  });

  it('is case sensitive and scores punctuation and numbers', () => {
    const s = typeStr(createEngine('Hi, 42!'), 'hi, 42!');
    expect(s.errors).toBe(1);
    expect(s.correct).toBe(6);
  });

  it('tracks combos and resets on error', () => {
    let s = createEngine('abcdef');
    s = typeStr(s, 'abc');
    expect(s.combo).toBe(3);
    s = typeChar(s, 'x', 5000);
    expect(s.combo).toBe(0);
    expect(s.maxCombo).toBe(3);
  });

  it('counts per-key errors against the expected key', () => {
    const s = typeStr(createEngine('cat'), 'cxt');
    expect(s.keyErrors).toEqual({ a: 1 });
    expect(s.keyHits.a).toBe(1);
  });

  it('auto-fills indentation after Enter in code mode, and backspace removes it as one unit', () => {
    const target = 'if (x) {\n    go();\n}';
    let s = createEngine(target, { autoIndent: true });
    s = typeStr(s, 'if (x) {\n');
    expect(s.typed).toBe('if (x) {\n    ');
    expect(s.errors).toBe(0);
    s = backspace(s, 9000);
    expect(s.typed).toBe('if (x) {\n');
    s = typeStr(s, '    go();\n}', 9100);
    expect(s.finishedAt).not.toBeNull();
    expect(s.errors).toBe(0);
  });

  it('time-mode text can be extended without losing state', () => {
    let s = createEngine('ab', { endOnComplete: false });
    s = typeStr(s, 'ab');
    expect(s.finishedAt).toBeNull();
    s = extendTarget(s, ' cd');
    s = typeStr(s, ' cd', 3000);
    expect(s.correct).toBe(5);
  });

  it('builds a per-second series and cumulative chars', () => {
    let s = createEngine('a'.repeat(200), { endOnComplete: false });
    for (let i = 0; i < 100; i++) s = typeChar(s, 'a', i * 100); // 10 chars/sec for 10s
    const r = finalize(s, 10000);
    expect(r.cumChars.length).toBe(10);
    expect(r.cumChars[9]).toBe(100);
    expect(r.wpmSeries[9]).toBeCloseTo(120, 0); // 10 cps = 120 wpm
  });

  it('ghost interpolation follows the recorded run', () => {
    const cum = [10, 20, 30];
    expect(ghostChars(cum, 1, 0)).toBe(0);
    expect(ghostChars(cum, 1, 500)).toBeCloseTo(5);
    expect(ghostChars(cum, 1, 1500)).toBeCloseTo(15);
    expect(ghostChars(cum, 1, 9999)).toBe(30);
  });

  it('consistency is 100 for steady rhythm and lower for erratic', () => {
    expect(consistencyFromWords([50, 50, 50, 50])).toBe(100);
    expect(consistencyFromWords([20, 90, 30, 100, 10])).toBeLessThan(60);
    expect(consistencyFromWords([1, 2])).toBe(100);
  });

  it('handles fast typing (many keystrokes in the same ms) without dropping any', () => {
    let s = createEngine('abcdefghij');
    for (const ch of 'abcdefghij') s = typeChar(s, ch, 100);
    expect(s.typed).toBe('abcdefghij');
    expect(s.correct).toBe(10);
  });
});

describe('normalizeText', () => {
  it('converts typographic characters to keyboard ones', () => {
    expect(normalizeText('It’s “fine” — really…')).toBe('It\'s "fine" - really...');
  });
  it('collapses whitespace for prose', () => {
    expect(normalizeText('a   b\n\n c\t d')).toBe('a b c d');
  });
  it('keeps newlines for code', () => {
    expect(normalizeText('a  \nb\r\nc', { keepNewlines: true })).toBe('a\nb\nc');
  });
});

describe('save & resume', () => {
  const target = 'the quick brown fox jumps over the lazy dog and keeps running far away. '.repeat(12).trim();
  type Op = { k: 'c'; ch: string } | { k: 'b' };
  // typed with mistakes: one wrong key just before the save point, fixed right after resuming
  const buildOps = (splitAt: number): Op[] => {
    const ops: Op[] = [];
    for (let i = 0; i < splitAt - 1; i++) ops.push({ k: 'c', ch: target[i] });
    ops.push({ k: 'c', ch: '#' }); // wrong key, still uncorrected when saved
    ops.push({ k: 'b' });
    ops.push({ k: 'c', ch: target[splitAt - 1] });
    for (let i = splitAt; i < target.length; i++) ops.push({ k: 'c', ch: target[i] });
    return ops;
  };
  const apply = (st: EngineState, op: Op, t: number) => (op.k === 'c' ? typeChar(st, op.ch, t) : backspace(st, t));

  it('a run saved halfway and resumed later scores like one typed straight through', () => {
    const split = 300;
    const ops = buildOps(split);
    const gap = 100;

    let straight = createEngine(target);
    ops.forEach((op, i) => (straight = apply(straight, op, 1000 + i * gap)));
    const expected = finalize(straight, straight.finishedAt!);

    // sitting one: stop right after the wrong key (index `split - 1` of ops), i.e. with an error on screen
    const m = split; // ops[0..m-1] applied (the last one is the wrong '#')
    let first = createEngine(target);
    ops.slice(0, m).forEach((op, i) => (first = apply(first, op, 1000 + i * gap)));
    const saved = JSON.parse(JSON.stringify(snapshot(first, m * gap)));

    // sitting two: much later, on a fresh clock
    let resumed = restoreEngine(target, saved, 9_999_000);
    expect(resumed.typed).toBe(first.typed);
    ops.slice(m).forEach((op, i) => (resumed = apply(resumed, op, 9_999_000 + i * gap)));
    const got = finalize(resumed, resumed.finishedAt!);

    for (const k of ['netWpm', 'rawWpm', 'accuracy', 'consistency', 'charsTyped', 'correctChars', 'errors', 'keystrokes', 'durationSec', 'seriesStep'] as const) {
      expect(got[k], k).toBe(expected[k]);
    }
    expect(got.wpmSeries).toEqual(expected.wpmSeries);
    expect(got.cumChars).toEqual(expected.cumChars);
  });

  it('resuming never counts the time spent away and keeps the timer running from the saved time', () => {
    let s = createEngine(target);
    for (let i = 0; i < 40; i++) s = typeChar(s, target[i], 1000 + i * 200);
    const snap = snapshot(s, 8000);
    const r = restoreEngine(target, snap, 5_000_000);
    expect(5_000_000 - r.startedAt!).toBe(8000);
    // saving again straight after a restore round-trips
    const again = snapshot(r, 8000);
    expect(again.typed).toBe(snap.typed);
    expect(again.snaps).toEqual(snap.snaps);
    expect(again.words).toEqual(snap.words);
  });

  it('snapshots survive JSON and stay small for a long run', () => {
    let s = createEngine(target, { endOnComplete: false });
    for (let i = 0; i < 700; i++) s = typeChar(s, target[i % target.length], i * 250);
    const snap = snapshot(s, 700 * 250);
    expect(snap.snaps.length).toBe(Math.floor((700 * 250) / 1000));
    expect(JSON.stringify(snap).length).toBeLessThan(40_000);
  });
});
