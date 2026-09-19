import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Lock, Star, X, Lightbulb, RotateCcw } from 'lucide-react';
import { useStore, isLessonUnlocked } from '../store';
import { LESSONS, LESSON_SECTIONS, PASS_ACCURACY, getLesson, lessonText, starsFor } from '../data/lessons';
import { PageHeader, Modal } from '../components/ui';
import { SessionRunner } from '../components/SessionRunner';
import { FingerLegend } from '../components/KeyboardVisual';
import { keyInfo, physicalKey } from '../lib/fingers';
import { random } from '../lib/rng';

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <Star key={i} size={size} className={i <= n ? 'fill-caret text-caret' : 'text-untyped'} />
      ))}
    </span>
  );
}

export function LessonsPage() {
  const data = useStore();
  const setSettings = useStore((s) => s.setSettings);
  const [confirm, setConfirm] = useState(false);
  const passed = LESSONS.filter((l) => data.lessons[l.id]?.passed).length;

  return (
    <div>
      <PageHeader
        title="Touch-typing lessons"
        subtitle={`Learn every key with the right finger. Pass each lesson with ${PASS_ACCURACY}% accuracy to move on.`}
        right={<div className="text-sm text-muted"><strong className="text-fg tabular">{passed}</strong> / {LESSONS.length} passed</div>}
      />

      <div className="card mb-8 p-4">
        <div className="mb-2 text-center text-xs text-muted">Each finger has its own colour — the keyboard in every lesson shows which finger to use.</div>
        <FingerLegend />
      </div>

      <div className="space-y-10">
        {LESSON_SECTIONS.map((section) => (
          <section key={section} aria-labelledby={`sec-${section}`}>
            <h2 id={`sec-${section}`} className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">{section}</h2>
            <ol className="grid gap-3 sm:grid-cols-2">
              {LESSONS.filter((l) => l.section === section).map((l) => {
                const p = data.lessons[l.id];
                const unlocked = isLessonUnlocked(data, l.index);
                const card = (
                  <div className={`card flex items-center gap-4 p-4 ${unlocked ? 'transition hover:bg-surface2' : 'opacity-55'}`}>
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-base font-bold ${p?.passed ? 'bg-success/20 text-success' : unlocked ? 'bg-accent/15 text-accent' : 'bg-surface2 text-untyped'}`}>
                      {p?.passed ? <Check size={20} /> : unlocked ? l.index + 1 : <Lock size={16} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{l.title}</div>
                      <div className="truncate text-xs text-muted">{l.review ? 'Review · ' : ''}{l.description}</div>
                      {p && <div className="mt-1 flex items-center gap-2 text-xs text-muted"><Stars n={p.stars} /> best {Math.round(p.bestAccuracy)}%</div>}
                    </div>
                    {unlocked && <ArrowRight size={18} className="text-muted" />}
                  </div>
                );
                return <li key={l.id}>{unlocked ? <Link to={`/lessons/${l.id}`}>{card}</Link> : <div aria-disabled="true" title="Pass the previous lesson to unlock">{card}</div>}</li>;
              })}
            </ol>
          </section>
        ))}
      </div>

      {!data.settings.unlockAllLessons && (
        <div className="mt-10 text-center">
          <button className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline" onClick={() => setConfirm(true)}>
            I already touch-type — unlock all lessons
          </button>
        </div>
      )}
      <Modal
        open={confirm} onClose={() => setConfirm(false)} title="Unlock every lesson?"
        actions={<><button className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancel</button><button className="btn btn-primary" onClick={() => { setSettings({ unlockAllLessons: true }); setConfirm(false); }}>Unlock all</button></>}
      >
        You'll be able to jump to any lesson. Your progress and stars are still tracked as normal.
      </Modal>
    </div>
  );
}

export function LessonPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const lesson = getLesson(id);
  const data = useStore();
  const setSettings = useStore((s) => s.setSettings);
  const noPeeking = useStore((s) => s.settings.noPeeking);
  const [run, setRun] = useState(0);

  const text = useMemo(() => (lesson ? lessonText(lesson, random) : ''), [lesson, run]);
  if (!lesson) return <Navigate to="/lessons" replace />;
  if (!isLessonUnlocked(data, lesson.index)) return <Navigate to="/lessons" replace />;

  const next = LESSONS[lesson.index + 1];
  const focus = lesson.focus.flatMap((k) => (k === 'shift' ? ['shiftL', 'shiftR'] : [physicalKey(k)]));
  const spec = {
    text,
    mode: 'lesson' as const,
    modeKey: `lesson-${lesson.id}`,
    ref: { type: 'lesson' as const, lessonId: lesson.id },
    keyboard: { focus, noPeeking },
    label: `Lesson ${lesson.index + 1} · ${lesson.title}`,
  };

  return (
    <div>
      <div className="chrome mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link to="/lessons" className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft size={16} /> All lessons</Link>
        <button className="chip" aria-pressed={noPeeking} onClick={() => setSettings({ noPeeking: !noPeeking })} title="Hide key hints to build muscle memory. Hints reappear after a mistake.">
          {noPeeking ? <EyeOff size={16} /> : <Eye size={16} />} No-peeking mode {noPeeking ? 'on' : 'off'}
        </button>
      </div>

      <div className="chrome mb-6 text-center">
        <div className="label">{lesson.section} · Lesson {lesson.index + 1}</div>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{lesson.title}</h1>
        {lesson.newKeys.length > 0 && !lesson.review && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted">New keys:</span>
            {lesson.newKeys.map((k) => {
              const info = keyInfo(k);
              return (
                <kbd key={k} className="grid h-9 min-w-9 place-items-center rounded-lg border-2 px-2 font-mono text-base font-bold" style={{ borderColor: info ? `var(--f-${info.finger})` : 'var(--border)', color: info ? `var(--f-${info.finger})` : undefined }}>
                  {k === 'shift' ? '⇧ Shift' : k}
                </kbd>
              );
            })}
          </div>
        )}
        <p className="mx-auto mt-3 flex max-w-xl items-start justify-center gap-2 text-sm text-muted"><Lightbulb size={16} className="mt-0.5 shrink-0 text-caret" /> {lesson.tip}</p>
      </div>

      <SessionRunner
        key={`${lesson.id}-${run}`}
        spec={spec}
        onRestart={() => setRun((r) => r + 1)}
        onQuit={() => navigate('/lessons')}
        hint={<span>Goal: {PASS_ACCURACY}% accuracy. Speed does not matter here.</span>}
        renderNotice={({ result, reward }) => {
          const stars = starsFor(result.accuracy);
          return result.accuracy >= PASS_ACCURACY ? (
            <div className="card flex flex-wrap items-center justify-between gap-3 border-success/50 p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-success/20 text-success"><Check size={22} /></span>
                <div>
                  <div className="text-lg font-bold">Lesson passed!</div>
                  <div className="text-sm text-muted">{Math.round(result.accuracy)}% accuracy{reward.lessonPassed && next ? ` · “${next.title}” is unlocked` : ''}</div>
                </div>
              </div>
              <Stars n={stars} size={26} />
            </div>
          ) : (
            <div className="card flex items-center gap-3 border-caret/50 p-5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-caret/20 text-caret"><X size={22} /></span>
              <div>
                <div className="text-lg font-bold">So close — not quite there yet</div>
                <div className="text-sm text-muted">You scored {Math.round(result.accuracy)}%. You need {PASS_ACCURACY}% to pass. Slow down a touch and try again.</div>
              </div>
            </div>
          );
        }}
        renderActions={({ result }) => (
          <>
            <button className={`btn ${result.accuracy >= PASS_ACCURACY ? 'btn-ghost' : 'btn-primary'}`} onClick={() => setRun((r) => r + 1)} autoFocus={result.accuracy < PASS_ACCURACY}>
              <RotateCcw size={16} /> {result.accuracy >= PASS_ACCURACY ? 'Practise again' : 'Try again'}
            </button>
            {result.accuracy >= PASS_ACCURACY && next && (
              <button className="btn btn-primary" onClick={() => navigate(`/lessons/${next.id}`)} autoFocus>Next lesson <ArrowRight size={16} /></button>
            )}
            <Link to="/lessons" className="btn btn-ghost">Course map</Link>
          </>
        )}
      />
    </div>
  );
}
