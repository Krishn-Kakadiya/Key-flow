import { useId } from 'react';
import { useReducedMotion } from '../lib/hooks';

/** 0 = ember (no streak) … 5 = inferno (100+ days). */
export function flameLevel(streak: number): number {
  if (streak <= 0) return 0;
  if (streak < 3) return 1;
  if (streak < 7) return 2;
  if (streak < 14) return 3;
  if (streak < 30) return 4;
  return 5;
}

const OUTER = 'M32 3 C37 19 57 29 54 53 C52 68 43 77 32 77 C21 77 11 68 10 53 C9 40 21 34 23 20 C27 26 30 19 32 3 Z';
const INNER = 'M32 30 C35 40 45 45 43 58 C42 66 38 71 32 71 C26 71 21 66 21 58 C21 51 28 47 29 40 C31 43 32 38 32 30 Z';

/** A living flame that grows and gets busier as the streak climbs. */
export function StreakFlame({ streak, size = 72, still = false }: { streak: number; size?: number; still?: boolean }) {
  const id = useId().replace(/:/g, '');
  const reduced = useReducedMotion() || still;
  const level = flameLevel(streak);
  const scale = [0.62, 0.72, 0.84, 0.96, 1.08, 1.2][level];
  const lit = level > 0;
  const anim = (dur: number, delay = 0) =>
    lit && !reduced ? { animation: `flame-flicker ${dur}s ease-in-out ${delay}s infinite`, transformOrigin: '50% 90%' } : undefined;
  const glow = [0, 2, 5, 9, 14, 20][level];

  return (
    <svg
      viewBox="0 0 64 80" width={size} height={size * 1.25} role="img"
      aria-label={lit ? `${streak}-day streak` : 'No active streak'}
      style={{ overflow: 'visible', filter: lit ? `drop-shadow(0 0 ${glow}px var(--flame-a))` : undefined }}
    >
      <defs>
        <linearGradient id={`o${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" style={{ stopColor: lit ? 'var(--flame-a)' : 'var(--untyped)' }} />
          <stop offset="1" style={{ stopColor: lit ? 'var(--flame-b)' : 'var(--muted)' }} />
        </linearGradient>
        <linearGradient id={`i${id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={level >= 5 ? '#60a5fa' : '#fff3c4'} />
          <stop offset="1" stopColor={level >= 5 ? '#e0f2fe' : '#ffffff'} />
        </linearGradient>
      </defs>
      <g transform={`translate(32 78) scale(${scale}) translate(-32 -78)`} opacity={lit ? 1 : 0.55}>
        {level >= 3 && (
          <g style={anim(1.9, 0.2)}>
            <path d={OUTER} transform="translate(-13 20) scale(.5)" fill={`url(#o${id})`} opacity=".75" />
            <path d={OUTER} transform="translate(45 22) scale(.45)" fill={`url(#o${id})`} opacity=".75" />
          </g>
        )}
        {level >= 4 && (
          <g style={anim(1.4, 0.1)}>
            <path d={OUTER} transform="translate(5 8) scale(.85)" fill={`url(#o${id})`} opacity=".55" />
          </g>
        )}
        <g style={anim(1.1)}>
          <path d={OUTER} fill={`url(#o${id})`} />
        </g>
        <g style={anim(0.8, 0.15)}>
          <path d={INNER} fill={`url(#i${id})`} opacity={lit ? 0.95 : 0.3} />
        </g>
      </g>
    </svg>
  );
}
