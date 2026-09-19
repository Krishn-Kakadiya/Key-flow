import confetti from 'canvas-confetti';

type Kind = 'pb' | 'streak' | 'book' | 'level' | 'small';

const css = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/** Confetti bursts. Callers pass `reduced` so the in-app motion setting is respected too. */
export function celebrate(kind: Kind, reduced: boolean) {
  if (reduced) return;
  const colors =
    kind === 'streak'
      ? [css('--flame-a', '#ff8a3d'), css('--flame-b', '#ffd166'), '#ffffff']
      : [css('--accent', '#5eead4'), css('--accent-2', '#a78bfa'), css('--caret', '#ffd166'), '#ffffff'];
  const base = { colors, disableForReducedMotion: true, zIndex: 100, ticks: 220 };
  if (kind === 'small') {
    void confetti({ ...base, particleCount: 40, spread: 60, origin: { y: 0.7 } });
    return;
  }
  if (kind === 'level') {
    const end = Date.now() + 1400;
    const frame = () => {
      void confetti({ ...base, particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.75 } });
      void confetti({ ...base, particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.75 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    return;
  }
  void confetti({ ...base, particleCount: 110, spread: 80, startVelocity: 45, origin: { y: 0.65 } });
  window.setTimeout(() => void confetti({ ...base, particleCount: 70, spread: 110, startVelocity: 30, origin: { y: 0.6 }, scalar: 0.9 }), 220);
}
