import { useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Flame, Gauge, Sparkles, Timer } from 'lucide-react';
import { useStore } from '../store';
import { SessionRunner } from '../components/SessionRunner';
import { generateWords } from '../lib/text';
import { random } from '../lib/rng';
import { typistPercentile } from '../lib/progress';

const GOALS = [
  { min: 5, label: 'Casual', blurb: 'A quick daily warm-up' },
  { min: 10, label: 'Steady', blurb: 'The sweet spot for most people' },
  { min: 15, label: 'Serious', blurb: 'Real, visible progress' },
  { min: 20, label: 'Intense', blurb: 'Fast improvement' },
  { min: 30, label: 'Devoted', blurb: 'All-in' },
];

function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`mx-auto flex min-h-dvh flex-col px-5 py-8 ${wide ? 'max-w-4xl' : 'max-w-3xl'}`}>
      <div className="mb-8 flex items-center gap-2.5 text-xl font-extrabold tracking-tight">
        <svg viewBox="0 0 64 64" width={34} height={34} aria-hidden="true">
          <rect width="64" height="64" rx="16" fill="var(--surface-2)" />
          <rect x="11" y="38" width="12" height="12" rx="3" fill="var(--accent)" />
          <rect x="26" y="38" width="12" height="12" rx="3" fill="var(--accent-2)" />
          <rect x="41" y="38" width="12" height="12" rx="3" fill="var(--accent)" opacity=".55" />
          <rect x="14" y="12" width="5" height="20" rx="2.5" fill="var(--caret)" />
          <rect x="25" y="16" width="26" height="4" rx="2" fill="var(--text)" opacity=".9" />
          <rect x="25" y="24" width="16" height="4" rx="2" fill="var(--untyped)" />
        </svg>
        Keyflow
      </div>
      <div className="flex flex-1 flex-col justify-center pb-12">{children}</div>
    </div>
  );
}

export function WelcomePage() {
  const navigate = useNavigate();
  const onboarded = useStore((s) => s.profile.onboarded);
  const finish = useStore((s) => s.finishOnboarding);
  const [step, setStep] = useState<'intro' | 'test' | 'goal'>('intro');
  const [run, setRun] = useState(0);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [goal, setGoal] = useState(10);
  const [testDone, setTestDone] = useState(false);

  const spec = useMemo(
    () => ({
      text: generateWords(70, random, { difficulty: 'mixed' }),
      extendWords: () => generateWords(30, random, { difficulty: 'mixed' }),
      timeLimit: 30,
      mode: 'time' as const,
      modeKey: 'time-30',
      tag: 'baseline' as const,
      keepGhost: true,
      label: 'Baseline test · 30 seconds',
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [run],
  );

  if (onboarded && step !== 'goal') return <Navigate to="/" replace />;

  if (step === 'intro') {
    return (
      <Shell>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Find your flow.
            <br />
            <span className="text-accent">One keystroke at a time.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Keyflow turns typing practice into a daily habit — stories, challenges, streaks and satisfying feedback. No account, no sign-up. Your progress stays on this device.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-3">
            <li className="flex items-start gap-2"><Gauge className="mt-0.5 shrink-0 text-accent" size={18} /> A 30-second test sets your starting speed.</li>
            <li className="flex items-start gap-2"><Flame className="mt-0.5 shrink-0 text-caret" size={18} /> Streaks and levels keep you coming back.</li>
            <li className="flex items-start gap-2"><Sparkles className="mt-0.5 shrink-0 text-accent2" size={18} /> Stories, lessons and daily challenges.</li>
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button className="btn btn-primary !px-6 !py-3 !text-base" onClick={() => setStep('test')} autoFocus>
              <Timer size={18} /> Take the 30-second test <ArrowRight size={18} />
            </button>
            <button className="btn btn-ghost !py-3" onClick={() => { finish({}); navigate('/'); }}>Skip for now</button>
          </div>
          <p className="mt-4 text-xs text-muted">Tip: use a physical keyboard. Start typing as soon as the test loads — the clock starts on your first keystroke.</p>
        </motion.div>
      </Shell>
    );
  }

  if (step === 'test') {
    return (
      <Shell wide>
        {!testDone && (
          <div className="mb-4 text-center">
            <div className="label">Baseline test</div>
            <p className="text-sm text-muted">Type the words below for 30 seconds. Don't worry about mistakes — this is just your starting point.</p>
          </div>
        )}
        <SessionRunner
          key={run}
          spec={spec}
          onRestart={() => setRun((r) => r + 1)}
          onQuit={() => setStep('intro')}
          onComplete={() => setTestDone(true)}
          compactResults
          renderNotice={({ result }) => (
            <div className="card p-5 text-center">
              <div className="text-2xl font-extrabold">You type at {Math.round(result.netWpm)} WPM. <span className="text-accent">Let's grow that.</span></div>
              <p className="mt-1 text-sm text-muted">
                That's faster than about {typistPercentile(result.netWpm)}% of typical typists. Your first personal best is on the board.
              </p>
            </div>
          )}
          renderActions={({ result }) => (
            <>
              <button className="btn btn-ghost" onClick={() => { setTestDone(false); setRun((r) => r + 1); }}>Retake test</button>
              <button className="btn btn-primary !px-6" onClick={() => { setBaseline(result.netWpm); setStep('goal'); }} autoFocus>
                Choose my daily goal <ArrowRight size={16} />
              </button>
            </>
          )}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How much time can you give it each day?</h1>
        <p className="mt-2 text-muted">Small and consistent beats big and rare. You can change this any time in Settings.</p>
        <div role="radiogroup" aria-label="Daily goal" className="mt-6 grid gap-3 sm:grid-cols-5">
          {GOALS.map((g) => (
            <button
              key={g.min} role="radio" aria-checked={goal === g.min} onClick={() => setGoal(g.min)}
              className={`card p-4 text-left transition ${goal === g.min ? '!border-accent bg-surface2' : 'hover:bg-surface2'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-extrabold tabular">{g.min}</span>
                {goal === g.min && <Check size={18} className="text-accent" />}
              </div>
              <div className="text-xs text-muted">min / day</div>
              <div className="mt-2 text-sm font-semibold">{g.label}</div>
              <div className="text-xs text-muted">{g.blurb}</div>
            </button>
          ))}
        </div>
        <div className="mt-8">
          <button className="btn btn-primary !px-6 !py-3 !text-base" onClick={() => { finish({ baselineWpm: baseline, goalMinutes: goal }); navigate('/'); }} autoFocus>
            Let's go <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>
    </Shell>
  );
}
