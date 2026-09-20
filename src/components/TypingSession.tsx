import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, RotateCcw, Flag, LogOut, MousePointerClick, Save } from 'lucide-react';
import {
  backspace, createEngine, extendTarget, finalize, ghostChars, liveMetrics, restoreEngine, snapshot, typeChar,
  type EngineResult, type EngineSnapshot, type EngineState,
} from '../lib/engine';
import { TypingText } from './TypingText';
import { KeyboardVisual, Hands } from './KeyboardVisual';
import { playCountdown, playChime, playError, playKey } from '../lib/audio';
import { useUi } from '../store/ui';
import { Modal } from './ui';
import type { Ghost } from '../types';

export interface KeyboardOpts {
  focus?: string[];
  noPeeking?: boolean;
}

interface Props {
  text: string;
  /** seconds; the run ends when time is up (text keeps extending) */
  timeLimit?: number;
  extendWords?: () => string;
  autoIndent?: boolean;
  ghost?: Ghost | null;
  /** 3-2-1 before typing is allowed */
  countdown?: boolean;
  /** calm mode: no timer, ambience reacts to speed, "Finish" button */
  zen?: boolean;
  keyboard?: KeyboardOpts;
  onFinish: (result: EngineResult) => void;
  onRestart: () => void;
  onQuit?: () => void;
  /** reported to the parent so it can guard navigation */
  onProgress?: (inProgress: boolean) => void;
  hint?: ReactNode;
  /** long texts (story chapters) can be stopped and saved, then resumed later */
  saveable?: boolean;
  /** a saved run to resume; the session starts paused so the clock waits for the first key */
  resumeFrom?: EngineSnapshot | null;
  /** called with a snapshot whenever progress is saved (Stop & save, on a timer, or when the tab is hidden) */
  onSaveDraft?: (snap: EngineSnapshot) => void;
  /** called after the reader chose "Stop & save" (the parent should leave the page) */
  onStopped?: () => void;
  /** lets the parent trigger a save, e.g. from the "leave this page?" dialog */
  registerSave?: (save: (() => void) | null) => void;
}

/** Nothing is worth saving until this many characters have been typed. */
const MIN_SAVE_CHARS = 30;

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** One typing run: input handling, pause/resume, live stats, sounds, ghost. */
export function TypingSession({
  text, timeLimit, extendWords, autoIndent, ghost, countdown, zen, keyboard, onFinish, onRestart, onQuit, onProgress, hint,
  saveable = false, resumeFrom = null, onSaveDraft, onStopped, registerSave,
}: Props) {
  // A resumed run starts paused: the clock is frozen at the saved time until the first key press.
  const [init] = useState(() => {
    const t0 = performance.now();
    const opts = { endOnComplete: !timeLimit, autoIndent };
    return { t0, engine: resumeFrom ? restoreEngine(text, resumeFrom, t0, opts) : createEngine(text, opts) };
  });
  const [eng, setEng] = useState<EngineState>(init.engine);
  const engRef = useRef<EngineState>(init.engine);
  const [elapsed, setElapsed] = useState(resumeFrom?.elapsedMs ?? 0);
  const [paused, setPaused] = useState(!!resumeFrom);
  const [welcome, setWelcome] = useState(!!resumeFrom);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [done, setDone] = useState(false);
  const [focused, setFocused] = useState(false);
  const [idle, setIdle] = useState(true);
  const [count, setCount] = useState<number | null>(countdown ? 3 : null);
  const [mistake, setMistake] = useState(false);
  const [comboPulse, setComboPulse] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const pauseRef = useRef<{ at: number | null; total: number }>({ at: resumeFrom ? init.t0 : null, total: 0 });
  const lastSaved = useRef(resumeFrom ? `${resumeFrom.keystrokes}:${resumeFrom.typed.length}` : '');
  const doneRef = useRef(false);
  const idleTimer = useRef<number>(0);
  const mistakeTimer = useRef<number>(0);
  const setTyping = useUi((s) => s.setTyping);

  const clock = useCallback(() => (pauseRef.current.at ?? performance.now()) - pauseRef.current.total, []);
  const started = eng.startedAt !== null;
  const running = started && !done;
  const countdownActive = count !== null && count >= 0;
  const locked = countdownActive || confirmRestart;
  // a resumed run only counts as "in progress" once something new has been typed
  const dirty = !resumeFrom || eng.keystrokes > resumeFrom.keystrokes || eng.typed.length !== resumeFrom.typed.length;

  /* keep parent / global chrome informed */
  useEffect(() => {
    onProgress?.(running && dirty);
    setTyping(running && !paused);
    return () => setTyping(false);
  }, [running, dirty, paused, onProgress, setTyping]);

  useEffect(() => {
    if (!running || saveable) return; // saveable runs are kept safe by autosave instead of a warning
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running, saveable]);

  const finish = useCallback(
    (state: EngineState, durationMs: number) => {
      if (doneRef.current) return;
      doneRef.current = true;
      setDone(true);
      window.clearTimeout(idleTimer.current);
      onFinish(finalize(state, durationMs));
    },
    [onFinish],
  );

  const pause = useCallback(() => {
    if (pauseRef.current.at !== null || doneRef.current || engRef.current.startedAt === null) return;
    pauseRef.current.at = performance.now();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    if (pauseRef.current.at === null) return;
    pauseRef.current.total += performance.now() - pauseRef.current.at;
    pauseRef.current.at = null;
    setPaused(false);
    setWelcome(false);
    inputRef.current?.focus();
  }, []);

  /* ───── save & resume ───── */
  const saveNow = useCallback((): boolean => {
    const st = engRef.current;
    if (!saveable || !onSaveDraft || st.startedAt === null || doneRef.current || st.typed.length < MIN_SAVE_CHARS) return false;
    const sig = `${st.keystrokes}:${st.typed.length}`;
    if (sig === lastSaved.current) return true; // nothing new since the last save
    onSaveDraft(snapshot(st, clock() - st.startedAt));
    lastSaved.current = sig;
    return true;
  }, [saveable, onSaveDraft, clock]);

  const stopAndSave = useCallback(() => {
    if (saveNow()) onStopped?.();
  }, [saveNow, onStopped]);

  useEffect(() => {
    registerSave?.(saveable ? () => void saveNow() : null);
    return () => registerSave?.(null);
  }, [registerSave, saveable, saveNow]);

  // Autosave every 30 s of typing, and whenever the page is hidden or closed.
  useEffect(() => {
    if (!saveable) return;
    const id = window.setInterval(() => {
      if (pauseRef.current.at === null) saveNow();
    }, 30_000);
    const onHide = () => void saveNow();
    const onVis = () => document.hidden && void saveNow();
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('pagehide', onHide);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [saveable, saveNow]);

  /** Restart needs a confirmation once real progress exists on a long text. */
  const requestRestart = useCallback(() => {
    if (saveable && engRef.current.typed.length > 150) setConfirmRestart(true);
    else onRestart();
  }, [saveable, onRestart]);

  /* focus the hidden input */
  useEffect(() => {
    if (!locked) inputRef.current?.focus();
  }, [locked]);

  /* pressing a key while nothing is focused should just start typing */
  useEffect(() => {
    if (locked || done || paused) return;
    const grab = (e: KeyboardEvent) => {
      if (document.activeElement !== document.body) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length === 1 || e.key === 'Backspace') inputRef.current?.focus();
    };
    window.addEventListener('keydown', grab);
    return () => window.removeEventListener('keydown', grab);
  }, [locked, done, paused]);

  /* 3-2-1 */
  useEffect(() => {
    if (count === null) return;
    if (count < 0) return;
    playCountdown(count === 0);
    const id = window.setTimeout(() => setCount(count === 0 ? null : count - 1), count === 0 ? 450 : 900);
    return () => window.clearTimeout(id);
  }, [count]);

  /* ticker: elapsed time + time-limit enforcement */
  useEffect(() => {
    if (!running || paused) return;
    const id = window.setInterval(() => {
      const st = engRef.current;
      if (st.startedAt === null) return;
      const el = clock() - st.startedAt;
      setElapsed(el);
      if (timeLimit && el >= timeLimit * 1000) finish(st, timeLimit * 1000);
    }, 100);
    return () => window.clearInterval(id);
  }, [running, paused, timeLimit, clock, finish]);

  /* auto-pause when the window is hidden / loses focus mid-run */
  useEffect(() => {
    const auto = () => pause();
    const vis = () => document.hidden && pause();
    window.addEventListener('blur', auto);
    document.addEventListener('visibilitychange', vis);
    return () => {
      window.removeEventListener('blur', auto);
      document.removeEventListener('visibilitychange', vis);
    };
  }, [pause]);

  const commit = useCallback(
    (next: EngineState, prev: EngineState) => {
      let n = next;
      if (extendWords && n.target.length - n.typed.length < 240) n = extendTarget(n, ' ' + extendWords());
      engRef.current = n;
      setEng(n);

      if (n.errors > prev.errors) {
        playError();
        setMistake(true);
        window.clearTimeout(mistakeTimer.current);
        mistakeTimer.current = window.setTimeout(() => setMistake(false), 900);
      } else if (n.keystrokes > prev.keystrokes) {
        playKey();
        if (n.combo > 0 && n.combo % 50 === 0) playChime();
        if (n.combo > 0 && n.combo % 10 === 0) setComboPulse((p) => p + 1);
      }
      setIdle(false);
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => setIdle(true), 700);

      if (n.finishedAt !== null && prev.finishedAt === null) finish(n, n.finishedAt);
    },
    [extendWords, finish],
  );

  const typeKey = useCallback(
    (ch: string) => {
      const prev = engRef.current;
      const now = clock();
      if (timeLimit && prev.startedAt !== null && now - prev.startedAt >= timeLimit * 1000) return;
      commit(typeChar(prev, ch, now), prev);
    },
    [clock, commit, timeLimit],
  );

  const erase = useCallback(
    (word: boolean) => {
      const prev = engRef.current;
      commit(backspace(prev, clock(), word), prev);
    },
    [clock, commit],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (locked || done) return;
    if (paused) {
      e.preventDefault();
      if (e.key !== 'Escape') resume();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      requestRestart();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (started) pause();
      else onQuit?.();
      return;
    }
    if (e.nativeEvent.isComposing || e.key === 'Unidentified' || e.key === 'Process') return;
    const altGr = e.getModifierState?.('AltGraph');
    if (e.key === 'Backspace') {
      e.preventDefault();
      erase(e.ctrlKey || e.altKey);
      return;
    }
    if ((e.ctrlKey || e.metaKey || e.altKey) && !altGr) return; // leave browser shortcuts alone
    if (e.key === 'Enter') {
      e.preventDefault();
      typeKey('\n');
    } else if (e.key.length === 1) {
      e.preventDefault();
      typeKey(e.key);
    }
  };

  /* mobile / IME fallback: keydown didn't handle it, so the character arrives as input */
  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    const v = e.currentTarget.value;
    e.currentTarget.value = '';
    if (locked || done || paused) return;
    for (const ch of v) typeKey(ch);
  };

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const before = (e: Event) => {
      const ie = e as InputEvent;
      if (ie.inputType === 'deleteContentBackward') {
        e.preventDefault();
        if (!locked && !doneRef.current && pauseRef.current.at === null) erase(false);
      }
    };
    el.addEventListener('beforeinput', before);
    return () => el.removeEventListener('beforeinput', before);
  }, [erase, locked]);

  /* live numbers */
  const now = started ? elapsed : 0;
  const m = liveMetrics(eng, now);
  const timeLeft = timeLimit ? Math.max(0, timeLimit * 1000 - now) : 0;
  const nextChar = eng.target[eng.typed.length];
  const ghostIdx = ghost && started ? Math.floor(ghostChars(ghost.cum, ghost.step, now)) : ghost ? 0 : null;
  const pct = eng.target.length ? eng.typed.length / eng.target.length : 0;
  const wpm = m.netWpm;
  const zenOpacity = Math.min(0.62, 0.14 + (wpm / 110) * 0.5);
  const minutesLeft = Math.max(1, Math.round((eng.target.length - eng.typed.length) / 5 / Math.max(15, wpm)));
  const canSave = saveable && started && !done && !welcome && eng.typed.length >= MIN_SAVE_CHARS;

  return (
    <div className="relative" style={zen ? ({ ['--zen-o' as string]: zenOpacity } as React.CSSProperties) : undefined}>
      {zen && <div className="zen-bg" aria-hidden="true" />}
      <div className="relative z-10">
        {/* live stats */}
        <div className="mb-4 flex items-end justify-between gap-4 px-1" aria-live="off">
          <div className="flex items-baseline gap-5 sm:gap-8">
            {timeLimit ? (
              <Stat label="Time" value={started ? Math.ceil(timeLeft / 1000) : timeLimit} accent big />
            ) : zen ? null : (
              <Stat label="Time" value={fmt(now)} big />
            )}
            <Stat label="WPM" value={started ? Math.round(m.netWpm) : '–'} />
            <Stat label="Accuracy" value={started ? `${Math.round(m.accuracy)}%` : '–'} />
            <Stat label="Errors" value={started ? m.errors : '–'} className="hidden sm:block" />
            {saveable && started && <Stat label="Left" value={`~${minutesLeft} min`} className="hidden sm:block" />}
          </div>
          <div className="flex items-center gap-3">
            {eng.combo >= 10 && (
              <motion.div
                key={comboPulse}
                initial={{ scale: 1.35 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                className="rounded-lg px-2.5 py-1 text-sm font-bold tabular"
                style={{ color: 'var(--caret)', background: 'color-mix(in srgb, var(--caret) 14%, transparent)', textShadow: eng.combo >= 50 ? '0 0 12px var(--caret)' : undefined }}
                aria-label={`Combo ${eng.combo}`}
              >
                x{eng.combo}
              </motion.div>
            )}
            {zen && started && (
              <button className="btn btn-ghost !py-1.5 !text-xs" onClick={() => eng.correct >= 15 && finish(engRef.current, clock() - (engRef.current.startedAt ?? 0))} disabled={eng.correct < 15}>
                <Flag size={14} /> Finish
              </button>
            )}
          </div>
        </div>

        {/* text */}
        <div
          className="relative"
          onMouseDown={(e) => {
            e.preventDefault();
            if (paused) resume();
            else inputRef.current?.focus();
          }}
        >
          <TypingText
            target={eng.target} typed={eng.typed} combo={eng.combo} idle={idle || !focused}
            blurred={(!focused && !paused && !locked) || paused} ghostIndex={ghostIdx}
          />
          <input
            ref={inputRef}
            className="absolute left-0 top-0 h-full w-full cursor-text opacity-0"
            style={{ caretColor: 'transparent' }}
            aria-label="Typing input. Type the text shown above."
            autoCapitalize="off" autoCorrect="off" autoComplete="off" spellCheck={false}
            enterKeyHint="done" inputMode="text"
            onKeyDown={onKeyDown} onInput={onInput}
            onPaste={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            tabIndex={locked ? -1 : 0}
          />

          <>
            {!focused && !paused && !locked && !done && (
              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex items-center justify-center gap-2 text-sm font-medium text-fg"
                onClick={() => inputRef.current?.focus()}
              >
                <MousePointerClick size={18} /> Click here or press any key to focus
              </motion.button>
            )}
            {paused && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 px-4 text-center"
              >
                {welcome ? (
                  <>
                    <div className="flex items-center gap-2 text-lg font-semibold"><Save size={20} /> Welcome back</div>
                    <div className="max-w-md text-sm text-muted">
                      Your place is saved: <strong className="text-fg">{Math.round(pct * 100)}%</strong> through this chapter ({eng.typed.length.toLocaleString()} of {eng.target.length.toLocaleString()} characters). Press any key to carry on where you stopped.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-lg font-semibold"><Pause size={20} /> Paused</div>
                    <div className="text-sm text-muted">The clock is stopped. Press any key to continue.</div>
                  </>
                )}
                <div className="flex flex-wrap justify-center gap-2">
                  <button className="btn btn-primary" onClick={resume}><Play size={16} /> {welcome ? 'Continue' : 'Resume'}</button>
                  {canSave && !welcome && <button className="btn btn-ghost" onClick={stopAndSave}><Save size={16} /> Save &amp; exit</button>}
                  <button className="btn btn-ghost" onClick={requestRestart}><RotateCcw size={16} /> {welcome ? 'Start over' : 'Restart'}</button>
                  {onQuit && <button className="btn btn-ghost" onClick={onQuit}><LogOut size={16} /> {welcome ? 'Back' : 'Quit'}</button>}
                </div>
              </motion.div>
            )}
            {countdownActive && (
              <motion.div
                key={count}
                initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-20 grid place-items-center text-7xl font-black text-caret"
                aria-live="assertive"
              >
                {count === 0 ? 'Go!' : count}
              </motion.div>
            )}
          </>
        </div>

        {/* progress */}
        {!timeLimit && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)} aria-label="Progress through the text">
            <div className="h-full rounded-full bg-accent transition-[width] duration-150" style={{ width: `${pct * 100}%` }} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
          <div>{hint}</div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline"><kbd className="rounded bg-surface2 px-1.5 py-0.5">Tab</kbd> restart</span>
            <span className="hidden sm:inline"><kbd className="rounded bg-surface2 px-1.5 py-0.5">Esc</kbd> pause</span>
            {canSave && (
              <button className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={stopAndSave} title="Save your place and come back to finish later">
                <Save size={14} /> Stop &amp; save
              </button>
            )}
            <button className="chip !px-2 !py-1" onClick={requestRestart}><RotateCcw size={14} /> Restart</button>
          </div>
        </div>

        {keyboard && (
          <div className="mt-6 space-y-4">
            <Hands next={nextChar} noPeeking={keyboard.noPeeking} mistake={mistake} />
            <div className="hidden sm:block"><KeyboardVisual next={nextChar} noPeeking={keyboard.noPeeking} mistake={mistake} focus={keyboard.focus} /></div>
          </div>
        )}
      </div>

      <Modal
        open={confirmRestart}
        onClose={() => setConfirmRestart(false)}
        title="Start this chapter over?"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setConfirmRestart(false)}>Keep going</button>
            <button className="btn btn-danger" onClick={() => { setConfirmRestart(false); onRestart(); }}>Start over</button>
          </>
        }
      >
        You have typed {eng.typed.length.toLocaleString()} characters ({Math.round(pct * 100)}%). Starting over erases this progress, including anything you saved earlier.
      </Modal>
    </div>
  );
}

function Stat({ label, value, accent, big, className = '' }: { label: string; value: ReactNode; accent?: boolean; big?: boolean; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`font-semibold tabular leading-none ${big ? 'text-4xl' : 'text-2xl'} ${accent ? 'text-caret' : 'text-fg'}`}>{value}</div>
    </div>
  );
}
