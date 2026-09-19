import { useEffect, useState } from 'react';
import { toDateStr, msUntilMidnight } from './date';
import { useStore } from '../store';

/** Today's local date; re-renders when the local day rolls over. */
export function useToday(): string {
  const [today, setToday] = useState(() => toDateStr());
  useEffect(() => {
    let timer: number;
    const arm = () => {
      timer = window.setTimeout(() => {
        setToday(toDateStr());
        arm();
      }, msUntilMidnight() + 500);
    };
    arm();
    const onVisible = () => setToday(toDateStr());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
  return today;
}

/** True when animation should be minimised (OS preference or the in-app override). */
export function useReducedMotion(): boolean {
  const pref = useStore((s) => s.settings.reducedMotion);
  const [system, setSystem] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setSystem(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return pref === 'on' ? true : pref === 'off' ? false : system;
}

export function useCountdownToMidnight(): string {
  const [left, setLeft] = useState(msUntilMidnight());
  useEffect(() => {
    const id = window.setInterval(() => setLeft(msUntilMidnight()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const total = Math.max(0, Math.floor(left / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}
