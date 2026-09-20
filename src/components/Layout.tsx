import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, BookOpen, Check, ChevronsLeft, ChevronsRight, GraduationCap, Home, Keyboard, Palette, Settings, Trophy, Zap, X,
} from 'lucide-react';
import { useStore } from '../store';
import { useUi } from '../store/ui';
import { StreakFlame } from './StreakFlame';
import { effectiveStreak, levelProgress } from '../lib/progress';
import { unlockedThemes, themeById } from '../lib/themes';
import { useToday } from '../lib/hooks';

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/practice', label: 'Practice', icon: Keyboard },
  { to: '/stories', label: 'Storybook', icon: BookOpen },
  { to: '/lessons', label: 'Lessons', icon: GraduationCap },
  { to: '/challenge', label: 'Challenge', icon: Trophy },
  { to: '/stats', label: 'Stats', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

/** Label that smoothly slides/fades away (instead of being clipped) when the sidebar collapses. */
const fade = (show: boolean, gap = 'ml-3') =>
  `overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${show ? `${gap} max-w-40 opacity-100` : 'ml-0 max-w-0 opacity-0'}`;

function Logo({ small = false, iconOnly = false }: { small?: boolean; iconOnly?: boolean }) {
  return (
    <Link to="/" className="flex items-center font-extrabold tracking-tight" aria-label="Keyflow home">
      <svg viewBox="0 0 64 64" width={small ? 28 : 34} height={small ? 28 : 34} aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="var(--surface-2)" />
        <rect x="11" y="38" width="12" height="12" rx="3" fill="var(--accent)" />
        <rect x="26" y="38" width="12" height="12" rx="3" fill="var(--accent-2)" />
        <rect x="41" y="38" width="12" height="12" rx="3" fill="var(--accent)" opacity=".55" />
        <rect x="14" y="12" width="5" height="20" rx="2.5" fill="var(--caret)" />
        <rect x="25" y="16" width="26" height="4" rx="2" fill="var(--text)" opacity=".9" />
        <rect x="25" y="24" width="16" height="4" rx="2" fill="var(--untyped)" />
      </svg>
      <span className={`${small ? 'text-lg' : 'text-xl'} ${fade(!iconOnly, 'ml-2.5')}`} aria-hidden={iconOnly}>Keyflow</span>
    </Link>
  );
}

function TopCluster() {
  const today = useToday();
  const streak = useStore((s) => s.streak);
  const profile = useStore((s) => s.profile);
  const theme = useStore((s) => s.settings.theme);
  const setSettings = useStore((s) => s.setSettings);
  const shown = effectiveStreak(streak, today, profile.streakFreezes);
  const lvl = levelProgress(profile.xp);
  const avail = unlockedThemes(lvl.level);

  const cycle = () => {
    const i = avail.findIndex((t) => t.id === theme);
    setSettings({ theme: avail[(i + 1) % avail.length].id });
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-3">
      <Link to="/challenge" className="flex items-center gap-1 rounded-xl px-2 py-1 transition hover:bg-surface2" title={`${shown}-day streak`} aria-label={`${shown}-day streak`}>
        <StreakFlame streak={shown} size={18} still />
        <span className="text-sm font-bold tabular">{shown}</span>
      </Link>
      <Link to="/stats" className="flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-surface2" title={`Level ${lvl.level} · ${lvl.into}/${lvl.needed} XP`} aria-label={`Level ${lvl.level}, ${lvl.into} of ${lvl.needed} XP`}>
        <Zap size={16} className="text-accent2" />
        <span className="text-sm font-bold tabular">{lvl.level}</span>
        <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-surface2 sm:block">
          <span className="block h-full rounded-full bg-accent2 transition-[width] duration-500" style={{ width: `${lvl.pct * 100}%` }} />
        </span>
      </Link>
      <button className="grid h-9 w-9 place-items-center rounded-xl transition hover:bg-surface2" onClick={cycle} title={`Theme: ${themeById(theme).name} (click to change)`} aria-label={`Change theme. Current: ${themeById(theme).name}`}>
        <Palette size={18} />
      </button>
    </div>
  );
}

function LevelUpOverlay() {
  const levelUp = useUi((s) => s.levelUp);
  const dismiss = useUi((s) => s.dismissLevelUp);
  useEffect(() => {
    if (!levelUp) return;
    const id = window.setTimeout(dismiss, 6500);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('keydown', onKey);
    };
  }, [levelUp, dismiss]);

  if (!levelUp) return null;
  return (
    <>
      {levelUp && (
        <motion.div
          className="fixed inset-0 z-[60] grid cursor-pointer place-items-center bg-black/75 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={dismiss} role="dialog" aria-modal="true" aria-label={`Level up! You reached level ${levelUp.level}`}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 14 }}
          >
            <motion.div
              className="mx-auto mb-4 grid h-36 w-36 place-items-center rounded-full"
              style={{ background: 'radial-gradient(circle, var(--accent-2), transparent 70%)' }}
              animate={{ rotate: [0, 6, -6, 0] }} transition={{ duration: 2.4, repeat: Infinity }}
            >
              <div className="grid h-28 w-28 place-items-center rounded-full border-4 border-caret bg-surface text-6xl font-black text-caret shadow-2xl">
                {levelUp.level}
              </div>
            </motion.div>
            <div className="label !text-caret">Level up</div>
            <h2 className="mt-1 text-4xl font-black text-white sm:text-5xl">You reached level {levelUp.level}!</h2>
            {levelUp.themes.length > 0 && (
              <p className="mt-3 flex items-center justify-center gap-2 text-base text-white/85">
                <Palette size={18} /> New theme unlocked: {levelUp.themes.map((t) => themeById(t).name).join(', ')}
              </p>
            )}
            <p className="mt-6 text-sm text-white/60">Press Enter or click to continue</p>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}

/** Small confirmation message ("Progress saved") that clears itself after a few seconds. */
function Notice() {
  const notice = useUi((s) => s.notice);
  const clear = useUi((s) => s.clearNotice);
  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(clear, 4500);
    return () => window.clearTimeout(id);
  }, [notice, clear]);
  if (!notice) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[65] flex justify-center px-4 md:bottom-8" role="status" aria-live="polite">
      <motion.div
        key={notice.id}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium shadow-2xl"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success/20 text-success"><Check size={14} strokeWidth={3} /></span>
        <span>{notice.text}</span>
        <button className="chip !p-1" onClick={clear} aria-label="Dismiss"><X size={14} /></button>
      </motion.div>
    </div>
  );
}

function MobileHint() {
  const hidden = useStore((s) => s.settings.hideMobileHint);
  const set = useStore((s) => s.setSettings);
  const [coarse] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches);
  if (!coarse || hidden) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2 text-xs text-muted md:hidden">
      <span>Keyflow is best on a device with a physical keyboard.</span>
      <button className="chip !p-1" aria-label="Dismiss" onClick={() => set({ hideMobileHint: true })}><X size={14} /></button>
    </div>
  );
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('keyflow:sidebar') === '1';
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem('keyflow:sidebar', c ? '0' : '1');
      } catch { /* ignore */ }
      return !c;
    });
  };

  // Reset scroll on route change.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-onaccent">Skip to content</a>
      <aside className={`chrome sticky top-0 hidden h-dvh shrink-0 flex-col overflow-hidden border-r border-line bg-surface/60 px-3 py-5 md:flex ${collapsed ? 'w-[72px]' : 'w-60'}`} style={{ transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease' }}>
        <div className="mb-6 pl-[7px]">
          <Logo iconOnly={collapsed} />
        </div>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end} title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-surface2 text-accent' : 'text-muted hover:bg-surface2 hover:text-fg'}`
              }
            >
              <Icon size={19} className="shrink-0" />
              <span className={fade(!collapsed)}>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="chip w-full !gap-0 !px-3.5" onClick={toggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronsRight size={18} className="shrink-0" /> : <ChevronsLeft size={18} className="shrink-0" />}
          <span className={fade(!collapsed, 'ml-2')}>Collapse</span>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHint />
        <header className="chrome sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur md:justify-end">
          <div className="md:hidden"><Logo small /></div>
          <TopCluster />
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-6 sm:px-6 md:pb-12">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>

      <nav className="chrome fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-bg/90 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Main">
        {NAV.filter((n) => n.to !== '/settings').map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`}>
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
        <NavLink to="/settings" className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`}>
          <Settings size={20} />
          Settings
        </NavLink>
      </nav>

      <LevelUpOverlay />
      <Notice />
    </div>
  );
}

