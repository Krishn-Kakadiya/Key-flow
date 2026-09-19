import { useMemo } from 'react';
import { KEY_ROWS, keyInfo, FINGER_LABEL, type Finger } from '../lib/fingers';

interface KeyboardProps {
  /** the character the user must type next */
  next?: string;
  /** dim everything and hide labels; keys light up only after a mistake */
  noPeeking?: boolean;
  /** a mistake was just made (reveals the hint in no-peeking mode) */
  mistake?: boolean;
  /** heat map: value 0..1 per physical key (red = worse) */
  heat?: Record<string, number>;
  heatMode?: 'errors' | 'speed';
  /** keys to emphasise in lessons (physical key ids) */
  focus?: string[];
  compact?: boolean;
}

const fingerVar = (f: Finger) => `var(--f-${f})`;

function heatColor(v: number, mode: 'errors' | 'speed'): string {
  // 0 = good (accent), 1 = bad (error)
  const good = mode === 'errors' ? 'var(--success)' : 'var(--success)';
  return `color-mix(in srgb, var(--error) ${Math.round(v * 100)}%, ${good})`;
}

/** On-screen keyboard: colour-coded fingers, highlighted next key, optional heat map. */
export function KeyboardVisual({ next, noPeeking = false, mistake = false, heat, heatMode = 'errors', focus, compact = false }: KeyboardProps) {
  const info = next ? keyInfo(next) : undefined;
  const reveal = !noPeeking || mistake;
  const nextKeys = useMemo(() => {
    const set = new Set<string>();
    if (info && next !== undefined) {
      set.add(info.key);
      if (info.shiftKey) set.add(info.shiftKey);
    }
    return set;
  }, [info, next]);

  return (
    <div
      className="w-full select-none"
      role="img"
      aria-label={next && info ? `Next key: ${next === ' ' ? 'space' : next}. Use your ${FINGER_LABEL[info.finger].toLowerCase()}.` : 'On-screen keyboard'}
    >
      <div className="flex flex-col gap-1.5">
        {KEY_ROWS.map((row, r) => (
          <div key={r} className={`flex gap-1.5 ${r === 4 ? 'justify-center' : ''}`}>
            {row.map((k) => {
              const isNext = !heat && reveal && nextKeys.has(k.id);
              const dim = !heat && !noPeeking && !!focus?.length && !k.special && !focus.includes(k.id) && !isNext;
              const heatV = heat && !k.special ? heat[k.id] : undefined;
              const style: Record<string, string | number> = {
                flex: `${k.w} 1 0`,
                ['--kc' as string]: heat ? (heatV === undefined ? 'var(--muted)' : heatColor(heatV, heatMode)) : fingerVar(k.finger),
              };
              if (compact) style.height = 34;
              const homeBump = k.id === 'f' || k.id === 'j';
              return (
                <div
                  key={k.id}
                  className={`kb-key ${k.special ? 'special' : ''} ${isNext ? 'next' : ''} ${dim ? 'dim' : ''} ${noPeeking && !isNext ? 'blind' : ''}`}
                  style={style}
                  data-key={k.id}
                >
                  {k.special ? k.label : k.label}
                  {homeBump && !noPeeking && <span className="bump" />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────────── Hands ───────────── */

const FINGER_SHAPES: Record<'left' | 'right', { finger: Finger; x: number; y: number; h: number }[]> = {
  left: [
    { finger: 'lp', x: 6, y: 62, h: 46 },
    { finger: 'lr', x: 36, y: 34, h: 74 },
    { finger: 'lm', x: 66, y: 22, h: 86 },
    { finger: 'li', x: 96, y: 34, h: 74 },
    { finger: 'thumb', x: 126, y: 82, h: 46 },
  ],
  right: [
    { finger: 'thumb', x: 6, y: 82, h: 46 },
    { finger: 'ri', x: 36, y: 34, h: 74 },
    { finger: 'rm', x: 66, y: 22, h: 86 },
    { finger: 'rr', x: 96, y: 34, h: 74 },
    { finger: 'rp', x: 126, y: 62, h: 46 },
  ],
};

function Hand({ side, active, hidden }: { side: 'left' | 'right'; active: Finger[]; hidden: boolean }) {
  return (
    <svg viewBox="0 0 160 150" className="h-28 w-40 sm:h-32 sm:w-44" aria-hidden="true">
      <path d="M14 104 Q8 132 40 144 L122 144 Q152 132 148 104 Z" fill="var(--surface-2)" stroke="var(--border)" />
      {FINGER_SHAPES[side].map((f) => {
        const on = !hidden && active.includes(f.finger);
        return (
          <g key={f.finger}>
            <rect
              x={f.x} y={f.y} width={28} height={f.h + 8} rx={14}
              fill={on ? `var(--f-${f.finger})` : 'var(--surface-2)'}
              stroke={on ? `var(--f-${f.finger})` : 'var(--border)'} strokeWidth={on ? 2 : 1}
              style={{ transition: 'fill .15s', filter: on ? `drop-shadow(0 0 8px var(--f-${f.finger}))` : undefined }}
            />
            {!on && <rect x={f.x + 6} y={f.y + f.h - 6} width={16} height={4} rx={2} fill={`var(--f-${f.finger})`} opacity={0.55} />}
          </g>
        );
      })}
    </svg>
  );
}

export function Hands({ next, noPeeking, mistake }: { next?: string; noPeeking?: boolean; mistake?: boolean }) {
  const info = next ? keyInfo(next) : undefined;
  const hidden = !!noPeeking && !mistake;
  const shiftFinger: Finger | undefined = info?.shiftKey ? (info.shiftKey === 'shiftL' ? 'lp' : 'rp') : undefined;
  const active: Finger[] = info ? [info.finger, ...(shiftFinger ? [shiftFinger] : [])] : [];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-end justify-center gap-4 sm:gap-10">
        <Hand side="left" hidden={hidden} active={active} />
        <Hand side="right" hidden={hidden} active={active} />
      </div>
      <div className="h-5 text-center text-xs text-muted" aria-live="off">
        {info && !hidden ? (
          <>
            <span className="font-semibold" style={{ color: `var(--f-${info.finger})` }}>{FINGER_LABEL[info.finger]}</span>
            {info.needsShift && shiftFinger ? <> + <span className="font-semibold" style={{ color: `var(--f-${shiftFinger})` }}>{FINGER_LABEL[shiftFinger]}</span> (Shift)</> : null}
          </>
        ) : hidden ? 'No-peeking mode: hints appear only after a mistake' : ''}
      </div>
    </div>
  );
}

export function FingerLegend() {
  const items: Finger[] = ['lp', 'lr', 'lm', 'li', 'thumb', 'ri', 'rm', 'rr', 'rp'];
  return (
    <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-muted">
      {items.map((f) => (
        <li key={f} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: `var(--f-${f})` }} />
          {FINGER_LABEL[f]}
        </li>
      ))}
    </ul>
  );
}
