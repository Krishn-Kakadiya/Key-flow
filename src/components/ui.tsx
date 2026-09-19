import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useReducedMotion } from '../lib/hooks';

/** Number that counts up from 0 (or instantly under reduced motion). */
export function CountUp({
  value, decimals = 0, duration = 0.9, delay = 0, suffix = '',
}: { value: number; decimals?: number; duration?: number; delay?: number; suffix?: string }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced ? value : 0);
  useEffect(() => {
    if (reduced) {
      setShown(value);
      return;
    }
    const controls = animate(0, value, { duration, delay, ease: 'easeOut', onUpdate: (v) => setShown(v) });
    return () => controls.stop();
  }, [value, duration, delay, reduced]);
  return (
    <span className="tabular">
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function ProgressRing({
  pct, size = 96, stroke = 9, color = 'var(--accent)', children, label,
}: { pct: number; size?: number; stroke?: number; color?: string; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(clamped * 100)}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function StatCard({
  label, value, sub, className = '', big = false,
}: { label: string; value: ReactNode; sub?: ReactNode; className?: string; big?: boolean }) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="label">{label}</div>
      <div className={`mt-1 font-semibold tabular text-fg ${big ? 'text-5xl' : 'text-3xl'}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function Modal({
  open, onClose, title, children, actions,
}: { open: boolean; onClose: () => void; title: string; children?: ReactNode; actions?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className="card w-full max-w-md p-6 shadow-2xl outline-none"
        initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.18 }}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="chip -mr-2 -mt-1 !px-2" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="mt-2 text-sm text-muted">{children}</div>
        {actions && <div className="mt-5 flex flex-wrap justify-end gap-2">{actions}</div>}
      </motion.div>
    </motion.div>
  );
}

export function Segmented<T extends string | number>({
  value, onChange, options, label,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-1">
      {options.map((o) => (
        <button
          key={String(o.value)} role="radio" aria-checked={value === o.value} className="chip"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({
  checked, onChange, label, description,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <button
        type="button" role="switch" aria-checked={checked} aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border border-line transition-colors ${checked ? 'bg-accent' : 'bg-surface2'}`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${checked ? 'left-[22px] bg-onaccent' : 'left-0.5 bg-muted'}`}
          style={{ width: 18, height: 18 }}
        />
      </button>
    </label>
  );
}
