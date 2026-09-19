export type Finger = 'lp' | 'lr' | 'lm' | 'li' | 'thumb' | 'ri' | 'rm' | 'rr' | 'rp';

export const FINGER_LABEL: Record<Finger, string> = {
  lp: 'Left pinky',
  lr: 'Left ring',
  lm: 'Left middle',
  li: 'Left index',
  thumb: 'Thumb',
  ri: 'Right index',
  rm: 'Right middle',
  rr: 'Right ring',
  rp: 'Right pinky',
};

export interface KeyDef {
  /** unshifted character (also the id); special keys use a name */
  id: string;
  label: string;
  shifted?: string;
  finger: Finger;
  /** relative width (1 = a normal key) */
  w: number;
  special?: boolean;
}

const k = (id: string, finger: Finger, shifted?: string, w = 1): KeyDef => ({
  id,
  label: id.length === 1 && /[a-z]/.test(id) ? id.toUpperCase() : id,
  shifted,
  finger,
  w,
});
const sp = (id: string, label: string, finger: Finger, w: number): KeyDef => ({
  id,
  label,
  finger,
  w,
  special: true,
});

// Standard QWERTY touch-typing layout.
export const KEY_ROWS: KeyDef[][] = [
  [
    k('`', 'lp', '~'), k('1', 'lp', '!'), k('2', 'lr', '@'), k('3', 'lm', '#'), k('4', 'li', '$'),
    k('5', 'li', '%'), k('6', 'ri', '^'), k('7', 'ri', '&'), k('8', 'rm', '*'), k('9', 'rr', '('),
    k('0', 'rp', ')'), k('-', 'rp', '_'), k('=', 'rp', '+'), sp('backspace', '⌫', 'rp', 1.8),
  ],
  [
    sp('tab', 'Tab', 'lp', 1.5),
    k('q', 'lp'), k('w', 'lr'), k('e', 'lm'), k('r', 'li'), k('t', 'li'),
    k('y', 'ri'), k('u', 'ri'), k('i', 'rm'), k('o', 'rr'), k('p', 'rp'),
    k('[', 'rp', '{'), k(']', 'rp', '}'), k('\\', 'rp', '|', 1.3),
  ],
  [
    sp('caps', 'Caps', 'lp', 1.8),
    k('a', 'lp'), k('s', 'lr'), k('d', 'lm'), k('f', 'li'), k('g', 'li'),
    k('h', 'ri'), k('j', 'ri'), k('k', 'rm'), k('l', 'rr'), k(';', 'rp', ':'),
    k("'", 'rp', '"'), sp('enter', 'Enter', 'rp', 2.1),
  ],
  [
    sp('shiftL', 'Shift', 'lp', 2.3),
    k('z', 'lp'), k('x', 'lr'), k('c', 'lm'), k('v', 'li'), k('b', 'li'),
    k('n', 'ri'), k('m', 'ri'), k(',', 'rm', '<'), k('.', 'rr', '>'), k('/', 'rp', '?'),
    sp('shiftR', 'Shift', 'rp', 2.7),
  ],
  [sp('space', 'Space', 'thumb', 6.5)],
];

export interface KeyInfo {
  /** physical key id (unshifted) */
  key: string;
  finger: Finger;
  needsShift: boolean;
  /** which Shift key to press (opposite hand to the finger) */
  shiftKey?: 'shiftL' | 'shiftR';
}

const MAP = new Map<string, KeyInfo>();
for (const row of KEY_ROWS) {
  for (const def of row) {
    if (def.special) continue;
    MAP.set(def.id, { key: def.id, finger: def.finger, needsShift: false });
    if (def.shifted) {
      const left = def.finger.startsWith('l');
      MAP.set(def.shifted, {
        key: def.id,
        finger: def.finger,
        needsShift: true,
        shiftKey: left ? 'shiftR' : 'shiftL',
      });
    }
    if (/^[a-z]$/.test(def.id)) {
      const left = def.finger.startsWith('l');
      MAP.set(def.id.toUpperCase(), {
        key: def.id,
        finger: def.finger,
        needsShift: true,
        shiftKey: left ? 'shiftR' : 'shiftL',
      });
    }
  }
}
MAP.set(' ', { key: 'space', finger: 'thumb', needsShift: false });
MAP.set('\n', { key: 'enter', finger: 'rp', needsShift: false });

export function keyInfo(ch: string): KeyInfo | undefined {
  return MAP.get(ch);
}

/** Physical (unshifted) key for a character, or the char itself if unknown. */
export function physicalKey(ch: string): string {
  return MAP.get(ch)?.key ?? ch;
}

export const HOME_ROW_LEFT = ['a', 's', 'd', 'f'];
export const HOME_ROW_RIGHT = ['j', 'k', 'l', ';'];

/** Fingers in hand order (left → right) for the hands illustration. */
export const LEFT_HAND: Finger[] = ['lp', 'lr', 'lm', 'li', 'thumb'];
export const RIGHT_HAND: Finger[] = ['thumb', 'ri', 'rm', 'rr', 'rp'];
