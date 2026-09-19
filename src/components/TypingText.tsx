import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';

const TOKEN_RE = /[^ \n]*(?: +|\n)|[^ \n]+/g;

interface Tok {
  text: string;
  start: number;
}

function tokenize(target: string): Tok[] {
  const out: Tok[] = [];
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(target))) out.push({ text: m[0], start: m.index });
  return out;
}

const Word = memo(function Word({ text, typed, start }: { text: string; typed: string; start: number }) {
  const chars = text.split('');
  return (
    <span className="word">
      {chars.map((c, i) => {
        const t = typed[i];
        const nl = c === '\n';
        const cls = (t === undefined ? 'ch' : t === c ? 'ch c' : 'ch x') + (nl ? ' nl' : '');
        return (
          <span key={i} data-i={start + i} className={cls}>
            {nl ? '↵' : c}
          </span>
        );
      })}
    </span>
  );
});

const SPRING = { type: 'spring', stiffness: 900, damping: 46, mass: 0.45 } as const;

interface Props {
  target: string;
  typed: string;
  combo?: number;
  idle?: boolean;
  blurred?: boolean;
  /** show a second (ghost) caret at this index */
  ghostIndex?: number | null;
  /** scroll so the caret's line stays on row 2 of 3 */
  ariaLabel?: string;
}

function comboGlow(combo: number): number {
  if (combo >= 100) return 22;
  if (combo >= 50) return 16;
  if (combo >= 25) return 11;
  if (combo >= 10) return 6;
  return 0;
}

/** The text, the per-character states and the springy amber caret. */
export function TypingText({ target, typed, combo = 0, idle = false, blurred = false, ghostIndex = null, ariaLabel = 'Text to type' }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);
  const toks = useMemo(() => tokenize(target), [target]);
  const cx = useMotionValue(0);
  const cy = useMotionValue(0);
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);
  const placed = useRef({ main: false, ghost: false });
  const [line, setLine] = useState(0);
  const [lineH, setLineH] = useState(52);
  const idx = typed.length;

  const measure = useRef<() => void>(() => {});
  measure.current = () => {
    const root = innerRef.current;
    if (!root) return;
    const lh = parseFloat(getComputedStyle(root).lineHeight) || 52;
    if (Math.abs(lh - lineH) > 0.5) setLineH(lh);

    const locate = (i: number): { x: number; y: number } | null => {
      const el = root.querySelector<HTMLElement>(`[data-i="${i}"]`);
      if (el) return { x: el.offsetLeft, y: el.offsetTop };
      const prev = root.querySelector<HTMLElement>(`[data-i="${i - 1}"]`);
      if (prev) return { x: prev.offsetLeft + prev.offsetWidth, y: prev.offsetTop };
      return i <= 0 ? { x: 0, y: 0 } : null;
    };

    const main = locate(idx);
    if (main) {
      if (placed.current.main) {
        animate(cx, main.x, SPRING);
        animate(cy, main.y, SPRING);
      } else {
        cx.set(main.x);
        cy.set(main.y);
        placed.current.main = true;
      }
      const l = Math.round(main.y / lh);
      setLine((old) => (old === l ? old : l));
    }
    if (ghostIndex !== null) {
      const g = locate(ghostIndex);
      if (g) {
        if (placed.current.ghost) {
          animate(gx, g.x, { type: 'tween', duration: 0.12, ease: 'linear' });
          animate(gy, g.y, { type: 'tween', duration: 0.12, ease: 'linear' });
        } else {
          gx.set(g.x);
          gy.set(g.y);
          placed.current.ghost = true;
        }
      }
    }
  };

  useLayoutEffect(() => {
    measure.current();
  }, [idx, ghostIndex, target.length]);

  // Re-measure when the layout changes (resize, web-font load, font-size setting).
  useEffect(() => {
    const root = innerRef.current;
    if (!root) return;
    const redo = () => {
      placed.current = { main: false, ghost: false };
      measure.current();
    };
    const ro = new ResizeObserver(redo);
    ro.observe(root);
    void document.fonts?.ready.then(redo);
    return () => ro.disconnect();
  }, []);

  const offset = Math.max(0, line - 1) * lineH;
  const glow = comboGlow(combo);

  return (
    <div className={`typing typing-viewport ${blurred ? 'blurred' : ''}`} role="img" aria-label={ariaLabel}>
      <div ref={innerRef} className="typing-inner" style={{ transform: `translateY(${-offset}px)` }} aria-hidden="true">
        {toks.map((t) => (
          <span key={t.start} style={{ display: 'contents' }}>
            <Word text={t.text} typed={typed.slice(t.start, t.start + t.text.length)} start={t.start} />
            {t.text.endsWith('\n') && <br />}
          </span>
        ))}
        {ghostIndex !== null && <motion.div className="caret ghost" style={{ x: gx, y: gy }} />}
        <motion.div
          className={`caret ${idle ? 'idle' : ''}`}
          style={{ x: cx, y: cy, ['--glow' as string]: `${glow}px` }}
        />
      </div>
    </div>
  );
}
