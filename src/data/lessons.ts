import { ALL_WORDS, HOME_ROW_WORDS } from './words';
import { pick, shuffle, type Rng } from '../lib/rng';

export type LessonKind = 'letters' | 'numbers' | 'capitals' | 'punct' | 'symbols' | 'sentences';

export interface Lesson {
  id: string;
  index: number;
  section: string;
  title: string;
  description: string;
  tip: string;
  kind: LessonKind;
  /** keys introduced here (empty for review lessons) */
  newKeys: string[];
  /** every key available so far (letters and punctuation keys) */
  keys: string[];
  /** highlight these when reviewing */
  review?: boolean;
  /** shown as the key focus of the lesson */
  focus: string[];
}

export const PASS_ACCURACY = 90;

interface Def {
  section: string;
  title: string;
  description: string;
  tip: string;
  kind?: LessonKind;
  newKeys?: string[];
  review?: boolean;
}

const HOME_TIP = 'Rest your index fingers on the little bumps of F and J. Return to them after every key.';

const DEFS: Def[] = [
  { section: 'Home row', title: 'F and J', description: 'Meet your two anchor keys.', tip: HOME_TIP, newKeys: ['f', 'j'] },
  { section: 'Home row', title: 'D and K', description: 'Middle fingers join in.', tip: 'Keep your other fingers resting on their home keys while one finger reaches.', newKeys: ['d', 'k'] },
  { section: 'Home row', title: 'S and L', description: 'Bring in the ring fingers.', tip: 'Ring fingers are the weakest - go slowly and stay relaxed.', newKeys: ['s', 'l'] },
  { section: 'Home row', title: 'A and ;', description: 'Pinkies complete the home row.', tip: 'Your pinkies rest on A and the semicolon. Do not lift your whole hand.', newKeys: ['a', ';'] },
  { section: 'Home row', title: 'G and H', description: 'Index fingers stretch sideways.', tip: 'Index fingers reach to the middle: left hits G, right hits H. Come straight back home.', newKeys: ['g', 'h'] },
  { section: 'Home row', title: 'Home row review', description: 'Put it all together.', tip: 'Accuracy first. Speed comes on its own.', review: true },

  { section: 'Top row', title: 'E and I', description: 'Reach up with your middle fingers.', tip: 'Reach up, tap, and return to the home row. Do not look down.', newKeys: ['e', 'i'] },
  { section: 'Top row', title: 'R and U', description: 'Index fingers reach up.', tip: 'Left index takes R and T, right index takes Y and U.', newKeys: ['r', 'u'] },
  { section: 'Top row', title: 'T and Y', description: 'The long reach across.', tip: 'T and Y sit above G and H. Keep the motion small.', newKeys: ['t', 'y'] },
  { section: 'Top row', title: 'W and O', description: 'Ring fingers reach up.', tip: 'Ring fingers again - stay loose and tap lightly.', newKeys: ['w', 'o'] },
  { section: 'Top row', title: 'Q and P', description: 'Pinkies stretch to the top.', tip: 'Pinkies are short: rotate your hand slightly rather than straining.', newKeys: ['q', 'p'] },
  { section: 'Top row', title: 'Top row review', description: 'Two rows, real words.', tip: 'Watch your rhythm - even beats beat fast bursts.', review: true },

  { section: 'Bottom row', title: 'V and M', description: 'Index fingers curl down.', tip: 'Curl the finger down, then straight back to the home row.', newKeys: ['v', 'm'] },
  { section: 'Bottom row', title: 'C and ,', description: 'Middle fingers curl down.', tip: 'The comma is typed with your right middle finger.', newKeys: ['c', ','] },
  { section: 'Bottom row', title: 'X and .', description: 'Ring fingers curl down.', tip: 'The period is a right ring finger key.', newKeys: ['x', '.'] },
  { section: 'Bottom row', title: 'B and N', description: 'Index fingers reach across.', tip: 'B belongs to the left index, N to the right.', newKeys: ['b', 'n'] },
  { section: 'Bottom row', title: 'Z and /', description: 'Pinkies finish the bottom row.', tip: 'Left pinky takes Z, right pinky takes the slash.', newKeys: ['z', '/'] },
  { section: 'Bottom row', title: 'Bottom row review', description: 'All three letter rows.', tip: 'You now know every letter. Keep your wrists relaxed.', review: true },

  { section: 'Numbers', title: '1 2 3 4 5', description: 'Left hand numbers.', kind: 'numbers', tip: 'Reach from the home row and come straight back. 4 and 5 belong to the left index.', newKeys: ['1', '2', '3', '4', '5'] },
  { section: 'Numbers', title: '6 7 8 9 0', description: 'Right hand numbers.', kind: 'numbers', tip: '6 and 7 belong to the right index, 0 to the right pinky.', newKeys: ['6', '7', '8', '9', '0'] },

  { section: 'Capitals & punctuation', title: 'Capital letters', description: 'Use Shift with the opposite hand.', kind: 'capitals', tip: 'Press Shift with the pinky on the opposite hand of the letter you are capitalising.', newKeys: ['shift'] },
  { section: 'Capitals & punctuation', title: "Punctuation . , ' \" ! ?", description: 'Sentences need punctuation.', kind: 'punct', tip: 'Quotes use the right pinky. ! and ? need Shift.', newKeys: ["'", '"', '!', '?'] },

  { section: 'Symbols', title: '- _ ( ) :', description: 'Everyday symbols.', kind: 'symbols', tip: 'Take these slowly - pinkies handle most of them.', newKeys: ['-', '_', '(', ')', ':'] },
  { section: 'Symbols', title: '@ # $ % & * + =', description: 'Power-user symbols.', kind: 'symbols', tip: 'Shift is needed for most of these. Use the opposite hand.', newKeys: ['@', '#', '$', '%', '&', '*', '+', '='] },

  { section: 'Sentences', title: 'Real sentences', description: 'Put it all together.', kind: 'sentences', tip: 'Read one phrase ahead. Keep a steady, even rhythm.', review: true },
  { section: 'Sentences', title: 'The finish line', description: 'A full paragraph.', kind: 'sentences', tip: 'Breathe. You already know every key on the board.', review: true },
];

// Build cumulative key sets.
function build(): Lesson[] {
  const lessons: Lesson[] = [];
  const unlocked: string[] = [];
  DEFS.forEach((d, i) => {
    const newKeys = d.newKeys ?? [];
    for (const k of newKeys) if (k !== 'shift' && !unlocked.includes(k)) unlocked.push(k);
    const kind = d.kind ?? 'letters';
    const focus = d.review ? (kind === 'letters' ? sectionKeys(lessons, d.section) : []) : newKeys;
    lessons.push({
      id: `l${String(i + 1).padStart(2, '0')}`,
      index: i,
      section: d.section,
      title: d.title,
      description: d.description,
      tip: d.tip,
      kind,
      newKeys,
      keys: unlocked.slice(),
      review: d.review,
      focus,
    });
  });
  return lessons;
}

function sectionKeys(done: Lesson[], section: string): string[] {
  return done.filter((l) => l.section === section).flatMap((l) => l.newKeys);
}

export const LESSONS: Lesson[] = build();

export const LESSON_SECTIONS: string[] = Array.from(new Set(LESSONS.map((l) => l.section)));

export function getLesson(id: string | undefined): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function starsFor(accuracy: number): number {
  if (accuracy >= 98) return 3;
  if (accuracy >= 95) return 2;
  if (accuracy >= PASS_ACCURACY) return 1;
  return 0;
}

/* ───────────── text generation ───────────── */

const PUNCT_SUFFIX = new Set([',', '.', ';']);
const TARGET_LEN = 140;

const SENTENCES = [
  'The quick brown fox jumps over the lazy dog.',
  'Practice a little every day and it will add up faster than you think.',
  'A calm mind and a steady rhythm are worth more than raw speed.',
  'She sells sea shells by the sea shore, and the shells she sells are surely sea shells.',
  'Please keep your eyes on the screen and let your fingers find their way.',
  'Every expert was once a beginner who refused to give up.',
  'Rain fell softly on the roof while we sipped warm tea and told old stories.',
  'Good typing is not about hurry; it is about flow.',
  'When the last light faded, the town turned quiet and the stars came out.',
  'Small steps, taken daily, lead to big changes over time.',
  'How vexingly quick daft zebras jump!',
  'Pack my box with five dozen liquor jugs.',
  'We can build habits that make us proud, one keystroke at a time.',
  'The library was silent except for the soft turning of pages.',
];

const PARAGRAPH = [
  'Learning to type well is a lot like learning to ride a bike. At first every movement takes effort and attention, and it feels slower than simply pointing with one finger. Then, almost without noticing, your hands begin to know the way. Words appear on the screen as fast as you can think them. That quiet moment, when the keyboard disappears and only your ideas remain, is exactly what every lesson has been leading you toward.',
  'The best typists are not the fastest by accident. They practise a little every single day, they care about accuracy first, and they let speed grow on its own. If you have made it this far, you already have the most important skill of all: you keep showing up.',
];

const CAPITAL_NAMES = ['Anna', 'Ben', 'Carla', 'David', 'Elena', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack', 'Kate', 'Liam', 'Maya', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rosa', 'Sam', 'Tara', 'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe', 'Paris', 'London', 'Tokyo', 'Cairo', 'Lima', 'Oslo', 'Monday', 'Friday', 'April', 'June'];

const PUNCT_PHRASES = [
  'Hello, world.',
  "It's a lovely day, isn't it?",
  'Wait! Did you hear that?',
  '"Yes," she said, "I will."',
  "Don't stop now, you're doing great!",
  'Well, that was unexpected.',
  '"Where are we going?" he asked.',
  "I can't believe it's already noon.",
  'Stop. Breathe. Begin again.',
  '"Ready, set, go!" they shouted.',
  "What's your favourite song?",
  "Yes, no, maybe - it's your call.",
];

const SYMBOL_PHRASES_A = [
  'well-known', 'state-of-the-art', 'snake_case_name', 'user_id', '(see below)', '(a - b)', 'Note: read this', 'Time: 10:30',
  'item_1: done', 'first-rate', 'my_file_name', '(optional)', 'Step 1: begin', 'left-hand', 'x-ray', 'half-time (45:00)', 'to-do: rest', '(yes)', 'a_b_c', 'Total: 12',
];

const SYMBOL_PHRASES_B = [
  'user@mail', '#typing', '$5', '50%', 'R&D', '5*4', '2+2=4', 'a=b+c', '@home', '#1', '$20 + $5', '100% done', 'Q&A', 'x*y=z', '3+4=7', 'me@site', 'save 15%', '#goals', 'a&b', '$9=nine',
];

function randInt(rng: Rng, min: number, max: number) {
  return min + Math.floor(rng() * (max - min + 1));
}

function joinTo(tokens: string[], target: number): string {
  let out = '';
  for (const t of tokens) {
    const next = out ? `${out} ${t}` : t;
    if (next.length > target && out) break;
    out = next;
  }
  return out;
}

function letterLesson(l: Lesson, rng: Rng): string {
  const allowed = l.keys.filter((k) => /^[a-z]$/.test(k));
  const allowedSet = new Set(allowed);
  const focusKeys = l.review ? (l.focus.length ? l.focus : l.keys) : l.newKeys;
  const focusLetters = focusKeys.filter((k) => /^[a-z]$/.test(k));
  const focusPunct = focusKeys.filter((k) => !/^[a-z]$/.test(k));
  const drillPool = focusLetters.length ? focusLetters : allowed;

  const real = Array.from(new Set([...HOME_ROW_WORDS, ...ALL_WORDS])).filter(
    (w) => w.length <= 8 && [...w].every((c) => allowedSet.has(c)),
  );
  const realFocused = focusLetters.length ? real.filter((w) => focusLetters.some((c) => w.includes(c))) : real;

  const tokens: string[] = [];
  const addPunct = (word: string) => {
    if (!focusPunct.length) return word;
    const p = pick(focusPunct, rng);
    if (p === '/') return `${word}/${pick(allowed, rng)}${pick(allowed, rng)}`;
    if (PUNCT_SUFFIX.has(p)) return `${word}${p}`;
    return word;
  };

  let guard = 0;
  while (tokens.join(' ').length < TARGET_LEN + 20 && guard++ < 200) {
    const r = rng();
    let tok: string;
    if (r < 0.28 || (realFocused.length < 4 && r < 0.55)) {
      // drill: alternate a focus key with another allowed key
      const a = pick(drillPool, rng);
      const b = pick(allowed, rng);
      const len = randInt(rng, 2, 5);
      tok = Array.from({ length: len }, (_, i) => (i % 2 === 0 ? a : b)).join('');
    } else if (r < 0.5 || realFocused.length < 4) {
      const len = randInt(rng, 3, 5);
      tok = Array.from({ length: len }, () => (rng() < 0.6 ? pick(drillPool, rng) : pick(allowed, rng))).join('');
    } else {
      tok = pick(realFocused.length >= 6 && rng() < 0.75 ? realFocused : real, rng);
    }
    if (focusPunct.length && rng() < 0.45) tok = addPunct(tok);
    if (tokens[tokens.length - 1] === tok) continue;
    tokens.push(tok);
  }
  return joinTo(tokens, TARGET_LEN);
}

function numbersLesson(l: Lesson, rng: Rng): string {
  const digits = l.newKeys;
  const tokens: string[] = [];
  let guard = 0;
  while (tokens.join(' ').length < TARGET_LEN + 10 && guard++ < 200) {
    const len = randInt(rng, 2, 4);
    tokens.push(Array.from({ length: len }, () => pick(digits, rng)).join(''));
    if (rng() < 0.2) tokens.push(pick(['and', 'or', 'to', 'at', 'in', 'no', 'so'], rng));
  }
  return joinTo(tokens, TARGET_LEN);
}

function capitalsLesson(rng: Rng): string {
  const words = ALL_WORDS.filter((w) => w.length <= 6);
  const tokens: string[] = [];
  let guard = 0;
  while (tokens.join(' ').length < TARGET_LEN + 10 && guard++ < 200) {
    const r = rng();
    if (r < 0.5) tokens.push(pick(CAPITAL_NAMES, rng));
    else {
      const w = pick(words, rng);
      tokens.push(rng() < 0.4 ? w[0].toUpperCase() + w.slice(1) : w);
    }
  }
  return joinTo(tokens, TARGET_LEN);
}

function phraseLesson(pool: string[], rng: Rng): string {
  return joinTo(shuffle(pool, rng), TARGET_LEN + 10);
}

export function lessonText(l: Lesson, rng: Rng): string {
  switch (l.kind) {
    case 'numbers':
      return numbersLesson(l, rng);
    case 'capitals':
      return capitalsLesson(rng);
    case 'punct':
      return phraseLesson(PUNCT_PHRASES, rng);
    case 'symbols':
      return phraseLesson(l.newKeys.includes('-') ? SYMBOL_PHRASES_A : SYMBOL_PHRASES_B, rng);
    case 'sentences':
      if (l.title === 'The finish line') return pick(PARAGRAPH, rng);
      return joinTo(shuffle(SENTENCES, rng), 190);
    default:
      return letterLesson(l, rng);
  }
}
