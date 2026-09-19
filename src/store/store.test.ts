import { beforeEach, describe, expect, it } from 'vitest';
import { sanitize, defaultData } from './defaults';
import { LESSONS, lessonText, PASS_ACCURACY } from '../data/lessons';
import { STORIES } from '../data/stories';
import { seeded } from '../lib/rng';
import { challengeFor, challengeSpec } from '../lib/challenge';
import { generateWords, weakKeyText, rankWeakKeys } from '../lib/text';
import { keyInfo, KEY_ROWS } from '../lib/fingers';
import { toDateStr, addDays } from '../lib/date';

// Minimal in-memory localStorage so the persisted store can run under node.
const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
} as Storage;

const { useStore } = await import('./index');
const { createEngine, typeChar, finalize } = await import('../lib/engine');

function run(text: string, opts: { errorEvery?: number; gap?: number } = {}) {
  let s = createEngine(text);
  let t = 0;
  let i = 0;
  for (const ch of text) {
    const wrong = opts.errorEvery && i % opts.errorEvery === 0;
    s = typeChar(s, wrong ? (ch === 'z' ? 'y' : 'z') : ch, t);
    t += opts.gap ?? 150;
    i++;
  }
  return finalize(s, s.finishedAt ?? t);
}

beforeEach(() => {
  mem.clear();
  useStore.setState(defaultData());
});

describe('sanitize (corrupt data)', () => {
  it('returns clean defaults for garbage', () => {
    for (const bad of [null, undefined, 42, 'str', [], { profile: 5, sessions: 'x', streak: { current: 'a' } }]) {
      const d = sanitize(bad);
      expect(d.sessions).toEqual([]);
      expect(d.streak.current).toBe(0);
      expect(d.settings.theme).toBe('dark');
    }
  });
  it('keeps valid pieces and drops broken ones', () => {
    const d = sanitize({
      profile: { xp: 500, onboarded: true, streakFreezes: 99 },
      settings: { theme: 'nonexistent', fontSize: 9999 },
      sessions: [{ netWpm: 50, timestamp: 1, accuracy: 97 }, { nope: true }, 'x'],
      streak: { current: 4, lastActiveDate: '2026-01-02', history: ['2026-01-02', 'bad'] },
    });
    expect(d.profile.xp).toBe(500);
    expect(d.profile.streakFreezes).toBe(3);
    expect(d.settings.theme).toBe('dark');
    expect(d.settings.fontSize).toBe(48);
    expect(d.sessions).toHaveLength(1);
    expect(d.streak.history).toEqual(['2026-01-02']);
  });
});

describe('completeSession — the single source of truth for rewards', () => {
  const text = 'the quick brown fox jumps over the lazy dog and runs away home';

  it('ignores trivially short sessions', () => {
    const r = useStore.getState().completeSession({ result: run('hi there'), mode: 'time', modeKey: 'time-30' });
    expect(r.counted).toBe(false);
    expect(useStore.getState().sessions).toHaveLength(0);
    expect(useStore.getState().streak.current).toBe(0);
  });

  it('awards XP, starts the streak, records a PB and unlocks first badges', () => {
    const r = useStore.getState().completeSession({ result: run(text), mode: 'time', modeKey: 'time-30', keepGhost: true });
    const s = useStore.getState();
    expect(r.counted).toBe(true);
    expect(r.xp).toBeGreaterThan(0);
    expect(s.profile.xp).toBe(r.xp);
    expect(s.streak.current).toBe(1);
    expect(r.streakIncremented).toBe(true);
    expect(r.isPB).toBe(true);
    expect(r.isFirstRecord).toBe(true);
    expect(s.records.ghosts['time-30']).toBeDefined();
    expect(r.newBadges).toContain('first-steps');
    expect(s.sessions).toHaveLength(1);
  });

  it('a second session the same day does not bump the streak; a slower run is not a PB', () => {
    const store = useStore.getState();
    store.completeSession({ result: run(text, { gap: 100 }), mode: 'time', modeKey: 'time-30' });
    const r2 = store.completeSession({ result: run(text, { gap: 400 }), mode: 'time', modeKey: 'time-30' });
    expect(useStore.getState().streak.current).toBe(1);
    expect(r2.streakIncremented).toBe(false);
    expect(r2.isPB).toBe(false);
  });

  it('a faster run beats the previous best', () => {
    const store = useStore.getState();
    const a = store.completeSession({ result: run(text, { gap: 300 }), mode: 'time', modeKey: 'time-30' });
    const b = store.completeSession({ result: run(text, { gap: 120 }), mode: 'time', modeKey: 'time-30' });
    expect(b.isPB).toBe(true);
    expect(b.previousBest).toBeGreaterThan(0);
    expect(useStore.getState().records.bestWpmByMode['time-30']).toBeGreaterThan(a.previousBest);
  });

  it('sloppy runs never become personal bests', () => {
    const r = useStore.getState().completeSession({ result: run(text, { errorEvery: 2, gap: 50 }), mode: 'time', modeKey: 'time-30' });
    expect(r.isPB).toBe(false);
  });

  it('zen and custom sessions never set records', () => {
    const r = useStore.getState().completeSession({ result: run(text), mode: 'zen', modeKey: 'zen' });
    expect(r.isPB).toBe(false);
    expect(useStore.getState().records.bestWpmByMode.zen).toBeUndefined();
  });

  it('stories: finishing a chapter unlocks the next; finishing all completes the book once', () => {
    const story = STORIES.find((x) => x.id === 'pride')!;
    const last = story.chapters.length - 1;
    const store = useStore.getState();
    const play = (chapter: number) =>
      store.completeSession({
        result: run(story.chapters[chapter].text), mode: 'story', modeKey: `story-${story.id}-${chapter}`,
        ref: { type: 'story', storyId: story.id, chapter },
      });
    const first = play(0);
    expect(first.chapterUnlocked).toBe(true);
    expect(first.bookCompleted).toBe(false);
    for (let c = 1; c < last; c++) expect(play(c).bookCompleted).toBe(false);
    const finalChapter = play(last);
    expect(finalChapter.bookCompleted).toBe(true);
    expect(useStore.getState().stories[story.id].completedAt).not.toBeNull();
    expect(play(last).bookCompleted).toBe(false);
  });

  it(`lessons pass at ${PASS_ACCURACY}% accuracy and award stars`, () => {
    const lesson = LESSONS[0];
    const text = lessonText(lesson, seeded(1));
    const bad = useStore.getState().completeSession({
      result: run(text, { errorEvery: 3 }), mode: 'lesson', modeKey: `lesson-${lesson.id}`, ref: { type: 'lesson', lessonId: lesson.id },
    });
    expect(bad.lessonPassed).toBe(false);
    const good = useStore.getState().completeSession({
      result: run(text), mode: 'lesson', modeKey: `lesson-${lesson.id}`, ref: { type: 'lesson', lessonId: lesson.id },
    });
    expect(good.lessonPassed).toBe(true);
    expect(good.lessonStars).toBe(3);
    expect(useStore.getState().lessons[lesson.id].passed).toBe(true);
    expect(useStore.getState().lessons[lesson.id].attempts).toBe(2);
  });

  it('daily challenge only completes when its goal is met, and pays out once', () => {
    const date = toDateStr();
    const def = challengeFor(date);
    const ref = { type: 'challenge' as const, date, ctype: def.type };
    const bad = useStore.getState().completeSession({ result: run(text, { errorEvery: 2 }), mode: 'challenge', modeKey: `challenge-${def.type}`, ref });
    expect(bad.challengeCompleted).toBe(false);
    const good = useStore.getState().completeSession({ result: run(text), mode: 'challenge', modeKey: `challenge-${def.type}`, ref });
    expect(good.challengeCompleted).toBe(true);
    expect(good.xpLines.some((l) => l.label === 'Daily challenge')).toBe(true);
    const again = useStore.getState().completeSession({ result: run(text), mode: 'challenge', modeKey: `challenge-${def.type}`, ref });
    expect(again.challengeCompleted).toBe(false);
    expect(useStore.getState().challenges[date].attempts).toBe(3);
  });

  it('streak freezes can be bought with spendable XP and cap at 3', () => {
    const st = useStore.getState();
    expect(st.buyFreeze()).toBe(false);
    useStore.setState({ profile: { ...st.profile, xp: 1000 } });
    expect(useStore.getState().buyFreeze()).toBe(true);
    expect(useStore.getState().profile.xp).toBe(1000); // lifetime XP (level) never drops
    expect(useStore.getState().profile.spentXp).toBe(150);
    useStore.getState().buyFreeze();
    useStore.getState().buyFreeze();
    expect(useStore.getState().buyFreeze()).toBe(false);
    expect(useStore.getState().profile.streakFreezes).toBe(3);
  });

  it('a freeze saves a streak across a missed day', () => {
    const yesterday2 = addDays(toDateStr(), -2);
    const st = useStore.getState();
    useStore.setState({
      profile: { ...st.profile, streakFreezes: 1 },
      streak: { current: 4, longest: 4, lastActiveDate: yesterday2, history: [yesterday2], frozen: [] },
    });
    const r = useStore.getState().completeSession({ result: run(text), mode: 'time', modeKey: 'time-30' });
    expect(r.streakAfter).toBe(5);
    expect(r.freezesUsed).toBe(1);
    expect(useStore.getState().profile.streakFreezes).toBe(0);
  });
});

describe('export / import', () => {
  it('round-trips everything (export → wipe → import)', () => {
    const store = useStore.getState();
    store.completeSession({ result: run('the quick brown fox jumps over the lazy dog again'), mode: 'time', modeKey: 'time-30' });
    store.setSettings({ theme: 'light', fontSize: 36 });
    const json = useStore.getState().exportData();
    const before = JSON.parse(json).data;

    useStore.getState().resetAll();
    expect(useStore.getState().sessions).toHaveLength(0);
    expect(useStore.getState().importData(json)).toEqual({ ok: true });

    const after = JSON.parse(useStore.getState().exportData()).data;
    expect(after.sessions).toEqual(before.sessions);
    expect(after.profile.xp).toBe(before.profile.xp);
    expect(after.streak).toEqual(before.streak);
    expect(after.settings.theme).toBe('light');
  });

  it('rejects files that are not Keyflow backups', () => {
    expect(useStore.getState().importData('not json').ok).toBe(false);
    expect(useStore.getState().importData('{"hello":1}').ok).toBe(false);
    expect(useStore.getState().importData('[]').ok).toBe(false);
  });
});

describe('content & generators', () => {
  it('story text is typeable ASCII', () => {
    for (const s of STORIES) {
      for (const c of s.chapters) {
        expect(c.text.length).toBeGreaterThan(200);
        // eslint-disable-next-line no-control-regex
        expect(/^[\x20-\x7E]+$/.test(c.text), `${s.id}/${c.title}`).toBe(true);
      }
    }
  });

  it('every book is at least 1500 characters and ids are unique', () => {
    const ids = new Set<string>();
    for (const s of STORIES) {
      expect(ids.has(s.id), `duplicate id ${s.id}`).toBe(false);
      ids.add(s.id);
      const total = s.chapters.reduce((a, c) => a + c.text.length, 0);
      expect(total, `${s.title} has only ${total} characters`).toBeGreaterThanOrEqual(1500);
    }
  });

  it('library stories (cricket, adventure, growth) have chapters of 1000+ words', () => {
    const long = STORIES.filter((s) => ['cricket', 'adventure', 'growth'].includes(s.category));
    expect(long.length).toBeGreaterThan(0);
    for (const s of long) {
      s.chapters.forEach((c, i) => {
        const words = c.text.split(/\s+/).length;
        expect(words, `${s.title} / chapter ${i + 1} "${c.title}" has only ${words} words`).toBeGreaterThanOrEqual(1000);
      });
    }
  });

  it('newest stories are listed first', () => {
    const dates = STORIES.map((s) => s.added ?? '');
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  it('every lesson generates non-empty, typeable text using only unlocked keys', () => {
    for (const l of LESSONS) {
      const t = lessonText(l, seeded(7));
      expect(t.length, l.title).toBeGreaterThan(30);
      expect(t.endsWith(' ')).toBe(false);
      for (const ch of t) {
        expect(keyInfo(ch), `${l.title}: "${ch}"`).toBeDefined();
      }
      if (l.kind === 'letters') {
        const allowed = new Set([...l.keys, ' ']);
        for (const ch of t.toLowerCase()) {
          expect(allowed.has(ch), `${l.title}: "${ch}" not yet unlocked`).toBe(true);
        }
      }
    }
  });

  it('lessons introduce each new key with text that contains it', () => {
    for (const l of LESSONS.filter((x) => !x.review && x.kind === 'letters')) {
      const t = lessonText(l, seeded(3));
      for (const k of l.newKeys) expect(t.toLowerCase().includes(k), `${l.title} missing ${k}`).toBe(true);
    }
  });

  it('every printable ASCII key in the layout has a finger', () => {
    for (const row of KEY_ROWS) for (const k of row) if (!k.special) expect(keyInfo(k.id)?.finger).toBeDefined();
  });

  it('daily challenge is deterministic per date and varies across days', () => {
    expect(challengeFor('2026-06-01')).toEqual(challengeFor('2026-06-01'));
    const types = new Set(Array.from({ length: 10 }, (_, i) => challengeFor(addDays('2026-06-01', i)).type));
    expect(types.size).toBe(5);
    const a = challengeSpec(challengeFor('2026-06-01'), {});
    const b = challengeSpec(challengeFor('2026-06-01'), {});
    expect(a.text).toBe(b.text);
  });

  it('weak-key drills target the weakest keys', () => {
    const stats = { e: { hits: 100, errors: 40, ms: 30000 }, a: { hits: 100, errors: 1, ms: 20000 }, s: { hits: 100, errors: 2, ms: 20000 }, t: { hits: 100, errors: 25, ms: 40000 }, o: { hits: 100, errors: 3, ms: 20000 } };
    expect(rankWeakKeys(stats)[0].key).toBe('e');
    const drill = weakKeyText(stats, 40, seeded(5));
    expect(drill.personalised).toBe(true);
    expect(drill.keys).toContain('e');
    const withE = drill.text.split(' ').filter((w) => w.includes('e')).length;
    expect(withE).toBeGreaterThan(20);
  });

  it('word generator honours punctuation / numbers options', () => {
    const t = generateWords(60, seeded(2), { punctuation: true, numbers: true });
    expect(/[.?!]/.test(t)).toBe(true);
    expect(/\d/.test(t)).toBe(true);
    expect(t.split(' ')).toHaveLength(60);
  });
});
