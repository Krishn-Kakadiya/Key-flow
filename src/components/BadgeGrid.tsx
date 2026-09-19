import type { ComponentType } from 'react';
import {
  BookOpen, CalendarCheck, Crown, Flame, Gauge, GraduationCap, Keyboard, Leaf, Library, Moon, Rocket, Sparkles, Star, Sun, Target, Trophy, Zap, Lock,
} from 'lucide-react';
import { BADGES, badgeById, type BadgeDef, type BadgeIcon } from '../lib/badges';

const ICONS: Record<BadgeIcon, ComponentType<{ size?: number; className?: string }>> = {
  sparkles: Sparkles, gauge: Gauge, flame: Flame, target: Target, book: BookOpen, graduation: GraduationCap, trophy: Trophy,
  moon: Moon, sun: Sun, zap: Zap, crown: Crown, star: Star, leaf: Leaf, keyboard: Keyboard, calendar: CalendarCheck, library: Library, rocket: Rocket,
};

const TIER_COLOR = ['', '#cd7f32', '#c0c8d8', '#ffd166'];

export function BadgeMedal({ badge, locked = false, size = 44 }: { badge: BadgeDef; locked?: boolean; size?: number }) {
  const Icon = ICONS[badge.icon];
  const c = TIER_COLOR[badge.tier];
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size, height: size,
        background: locked ? 'var(--surface-2)' : `color-mix(in srgb, ${c} 20%, var(--surface))`,
        border: `2px solid ${locked ? 'var(--border)' : c}`,
        color: locked ? 'var(--untyped)' : c,
        boxShadow: locked ? undefined : `0 0 14px color-mix(in srgb, ${c} 35%, transparent)`,
      }}
    >
      {locked ? <Lock size={size * 0.4} /> : <Icon size={size * 0.5} />}
    </div>
  );
}

export function BadgeChip({ id }: { id: string }) {
  const b = badgeById(id);
  if (!b) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface2 p-2.5 pr-4">
      <BadgeMedal badge={b} />
      <div>
        <div className="text-sm font-semibold">{b.title}</div>
        <div className="text-xs text-muted">{b.description}</div>
      </div>
    </div>
  );
}

export function BadgeGrid({ unlocked }: { unlocked: Record<string, number> }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {BADGES.map((b) => {
        const at = unlocked[b.id];
        const locked = at === undefined;
        return (
          <li key={b.id} className={`flex items-center gap-3 rounded-xl border border-line p-3 ${locked ? 'opacity-70' : 'bg-surface2'}`}>
            <BadgeMedal badge={b} locked={locked} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{b.title}</div>
              <div className="text-xs text-muted">{b.description}</div>
              {!locked && <div className="mt-0.5 text-[11px] text-accent">Unlocked {new Date(at).toLocaleDateString()}</div>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
