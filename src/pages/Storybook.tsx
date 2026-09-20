import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock, Lock, Library, Save, Trophy } from 'lucide-react';
import { useStore, unlockedChapter, getStoryDraft, storyDraftKey, SAVE_MIN_CHARS } from '../store';
import { hashString } from '../lib/rng';
import { CATEGORY_LABEL, STORIES, getStory, storyChars, type Story, type StoryCategory } from '../data/stories';
import { PageHeader } from '../components/ui';
import { SessionRunner } from '../components/SessionRunner';

const DIFF_COLOR = { easy: 'text-success', medium: 'text-caret', hard: 'text-err' } as const;

function useTypicalWpm(): number {
  const sessions = useStore((s) => s.sessions);
  const baseline = useStore((s) => s.profile.baselineWpm);
  return useMemo(() => {
    const recent = sessions.slice(-10);
    if (recent.length >= 3) return Math.max(10, recent.reduce((a, s) => a + s.netWpm, 0) / recent.length);
    return Math.max(10, baseline ?? 30);
  }, [sessions, baseline]);
}

const estMinutes = (chars: number, wpm: number) => Math.max(1, Math.round(chars / 5 / wpm));

function Cover({ story, className = '', done = false }: { story: Story; className?: string; done?: boolean }) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-xl p-3 text-white shadow-lg ${className}`}
      style={{ background: `linear-gradient(160deg, ${story.colors[0]}, ${story.colors[1]})` }}
      aria-hidden="true"
    >
      <div className="absolute inset-y-0 left-0 w-2 bg-black/20" />
      <div className="pl-2 text-3xl drop-shadow">{story.emoji}</div>
      <div className="pl-2 text-sm font-extrabold leading-tight drop-shadow">{story.title}</div>
      {done && <div className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-black"><Check size={14} /></div>}
    </div>
  );
}

export function StoriesPage() {
  const stories = useStore((s) => s.stories);
  const wpm = useTypicalWpm();
  const [cat, setCat] = useState<'all' | StoryCategory>('all');

  const continueReading = useMemo(() => {
    const started = STORIES.map((s) => ({ s, p: stories[s.id] }))
      .filter((x) => x.p && x.p.completedAt === null && x.p.completedChapters.length > 0)
      .sort((a, b) => b.p!.lastPlayed - a.p!.lastPlayed)[0];
    if (!started) return null;
    const next = Math.min(started.s.chapters.length - 1, Math.max(...started.p!.completedChapters) + 1);
    return { story: started.s, next };
  }, [stories]);

  const drafts = useStore((s) => s.drafts);
  /** the most recently saved, still-valid chapter draft */
  const resumeItem = useMemo(() => {
    let best: { story: Story; chapter: number; pct: number; savedAt: number; minutesLeft: number } | null = null;
    for (const story of STORIES) {
      for (let i = 0; i < story.chapters.length; i++) {
        const c = story.chapters[i];
        const d = getStoryDraft({ drafts }, story.id, i);
        if (!d || (best && d.savedAt <= best.savedAt)) continue;
        const left = Math.max(1, Math.round((c.text.length - d.snapshot.typed.length) / 5 / Math.max(15, wpm)));
        best = { story, chapter: i, pct: d.snapshot.typed.length / c.text.length, savedAt: d.savedAt, minutesLeft: left };
      }
    }
    return best;
  }, [drafts, wpm]);

  const list = STORIES.filter((s) => cat === 'all' || s.category === cat);
  const shelf = STORIES.filter((s) => stories[s.id]?.completedAt);
  const cats: ('all' | StoryCategory)[] = ['all', 'cricket', 'fables', 'classics', 'scifi', 'adventure', 'growth', 'calm'];

  return (
    <div>
      <PageHeader title="Storybook" subtitle="Type your way through a story, one chapter at a time. Finish a chapter to unlock the next." />

      {resumeItem && (
        <Link
          to={`/stories/${resumeItem.story.id}/${resumeItem.chapter}`}
          className="card mb-6 flex items-center gap-4 border-accent/40 p-4 transition hover:bg-surface2"
        >
          <Cover story={resumeItem.story} className="h-24 w-[72px] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="label flex items-center gap-1 !text-accent"><Save size={13} /> Saved - pick up where you stopped</div>
            <div className="truncate text-lg font-bold">{resumeItem.story.title}</div>
            <div className="truncate text-sm text-muted">Chapter {resumeItem.chapter + 1}: {resumeItem.story.chapters[resumeItem.chapter].title}</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(resumeItem.pct * 100)} aria-label="Saved progress in this chapter">
                <div className="h-full rounded-full bg-accent" style={{ width: `${resumeItem.pct * 100}%` }} />
              </div>
              <span className="text-xs text-muted tabular">{Math.round(resumeItem.pct * 100)}% - about {resumeItem.minutesLeft} min left</span>
            </div>
          </div>
          <span className="btn btn-primary hidden sm:inline-flex">Resume <ArrowRight size={16} /></span>
        </Link>
      )}

      {!resumeItem && continueReading && (
        <Link to={`/stories/${continueReading.story.id}/${continueReading.next}`} className="card mb-6 flex items-center gap-4 p-4 transition hover:bg-surface2">
          <Cover story={continueReading.story} className="h-24 w-[72px] shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="label flex items-center gap-1"><BookOpen size={13} /> Continue reading</div>
            <div className="truncate text-lg font-bold">{continueReading.story.title}</div>
            <div className="truncate text-sm text-muted">Chapter {continueReading.next + 1}: {continueReading.story.chapters[continueReading.next].title}</div>
          </div>
          <span className="btn btn-primary hidden sm:inline-flex">Continue <ArrowRight size={16} /></span>
        </Link>
      )}

      <div className="mb-4 flex flex-wrap gap-1" role="tablist" aria-label="Story category">
        {cats.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} data-active={cat === c} className="chip" onClick={() => setCat(c)}>
            {c === 'all' ? 'All stories' : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {list.map((s) => {
          const p = stories[s.id];
          const done = p?.completedChapters.length ?? 0;
          return (
            <li key={s.id}>
              <Link to={`/stories/${s.id}`} className="card group flex h-full gap-4 p-4 transition hover:bg-surface2">
                <Cover story={s} className="h-36 w-[104px] shrink-0" done={!!p?.completedAt} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="label">{CATEGORY_LABEL[s.category]}</span>
                    <span className={`font-semibold capitalize ${DIFF_COLOR[s.difficulty]}`}>· {s.difficulty}</span>
                  </div>
                  <div className="mt-1 font-bold leading-snug">{s.title}</div>
                  <div className="text-xs text-muted">{s.author}</div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted">{s.blurb}</p>
                  <div className="mt-auto pt-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted">
                      <span>{done}/{s.chapters.length} chapters</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> ~{estMinutes(storyChars(s), wpm)} min</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuemin={0} aria-valuemax={s.chapters.length} aria-valuenow={done} aria-label={`${s.title} progress`}>
                      <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${(done / s.chapters.length) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <section className="mt-10" aria-labelledby="shelf">
        <h2 id="shelf" className="mb-3 flex items-center gap-2 text-lg font-bold"><Library size={20} className="text-accent2" /> Your bookshelf</h2>
        {shelf.length === 0 ? (
          <div className="card p-6 text-sm text-muted">Finish a whole book and its cover is added here as a collectible.</div>
        ) : (
          <div className="card flex flex-wrap items-end gap-4 border-b-8 border-b-surface2 p-5">
            {shelf.map((s) => (
              <Link key={s.id} to={`/stories/${s.id}`} title={s.title}>
                <Cover story={s} done className="h-32 w-24 transition hover:-translate-y-1" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export function StoryPage() {
  const { id } = useParams();
  const story = getStory(id);
  const stories = useStore((s) => s.stories);
  const data = useStore();
  const wpm = useTypicalWpm();
  if (!story) return <Navigate to="/stories" replace />;
  const p = stories[story.id];
  const unlocked = unlockedChapter(data, story.id);
  const done = p?.completedChapters.length ?? 0;

  return (
    <div>
      <Link to="/stories" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft size={16} /> Storybook</Link>
      <div className="mb-8 flex flex-wrap items-center gap-6">
        <Cover story={story} className="h-44 w-32 shrink-0" done={!!p?.completedAt} />
        <div className="min-w-0 flex-1">
          <div className="label">{CATEGORY_LABEL[story.category]} · <span className={`capitalize ${DIFF_COLOR[story.difficulty]}`}>{story.difficulty}</span></div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{story.title}</h1>
          <div className="text-sm text-muted">{story.author}</div>
          <p className="mt-2 max-w-lg text-sm text-muted">{story.blurb}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            <span>{done}/{story.chapters.length} chapters</span>
            <span className="flex items-center gap-1"><Clock size={12} /> ~{estMinutes(storyChars(story), wpm)} min total</span>
            {p?.completedAt && <span className="flex items-center gap-1 font-semibold text-success"><Trophy size={13} /> Book completed</span>}
          </div>
        </div>
      </div>

      <ol className="space-y-3">
        {story.chapters.map((c, i) => {
          const isDone = p?.completedChapters.includes(i);
          const locked = i > unlocked;
          const st = p?.stats[i];
          const dr = isDone ? null : getStoryDraft(data, story.id, i);
          const drPct = dr ? Math.round((dr.snapshot.typed.length / c.text.length) * 100) : 0;
          const inner = (
            <div className={`card flex items-center gap-4 p-4 ${locked ? 'opacity-60' : 'transition hover:bg-surface2'}`}>
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${isDone ? 'bg-success/20 text-success' : locked ? 'bg-surface2 text-untyped' : 'bg-accent/15 text-accent'}`}>
                {isDone ? <Check size={18} /> : locked ? <Lock size={16} /> : i + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{c.title}</div>
                <div className="text-xs text-muted">
                  {c.text.length} characters · ~{estMinutes(c.text.length, wpm)} min
                  {st && <> · best <strong className="text-fg">{Math.round(st.wpm)} WPM</strong> at {Math.round(st.accuracy)}%</>}
                  {dr && <span className="ml-1 inline-flex items-center gap-1 font-semibold text-accent">· <Save size={11} /> Saved at {drPct}% - resume</span>}
                </div>
                {dr && (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={drPct} aria-label={`Saved progress in ${c.title}`}>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${drPct}%` }} />
                  </div>
                )}
              </div>
              {!locked && <ArrowRight size={18} className="text-muted" />}
              {locked && <span className="text-xs text-muted">Finish chapter {i} to unlock</span>}
            </div>
          );
          return <li key={i}>{locked ? <div aria-disabled="true">{inner}</div> : <Link to={`/stories/${story.id}/${i}`}>{inner}</Link>}</li>;
        })}
      </ol>
    </div>
  );
}

export function ChapterPage() {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const story = getStory(id);
  const data = useStore();
  const discardDraft = useStore((s) => s.discardDraft);
  const [run, setRun] = useState(0);
  const n = Number(chapter);
  // Read once per (re)start: later autosaves must not swap the snapshot under a running session.
  const savedDraft = useMemo(
    () => (story && Number.isInteger(n) ? getStoryDraft(useStore.getState(), story.id, n) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [story, n, run],
  );

  if (!story || !Number.isInteger(n) || n < 0 || n >= story.chapters.length) return <Navigate to="/stories" replace />;
  if (n > unlockedChapter(data, story.id)) return <Navigate to={`/stories/${story.id}`} replace />;

  const ch = story.chapters[n];
  const hasNext = n + 1 < story.chapters.length;
  const saveable = ch.text.length >= SAVE_MIN_CHARS;
  const draftKey = storyDraftKey(story.id, n);
  const spec = {
    text: ch.text,
    mode: 'story' as const,
    modeKey: `story-${story.id}-${n}`,
    ref: { type: 'story' as const, storyId: story.id, chapter: n },
    label: `${story.title} · Chapter ${n + 1}`,
    draft: saveable
      ? {
          key: draftKey,
          sig: hashString(ch.text),
          textLength: ch.text.length,
          resume: savedDraft?.snapshot ?? null,
          onStopped: () => navigate(`/stories/${story.id}`),
        }
      : undefined,
  };

  return (
    <div>
      <div className="chrome mb-6 flex items-center justify-between gap-3">
        <Link to={`/stories/${story.id}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft size={16} /> {story.title}</Link>
        <div className="flex items-center gap-1.5" aria-label={`Chapter ${n + 1} of ${story.chapters.length}`}>
          {story.chapters.map((_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === n ? 'w-6 bg-accent' : i < n || data.stories[story.id]?.completedChapters.includes(i) ? 'w-2 bg-accent/60' : 'w-2 bg-surface2'}`} />
          ))}
        </div>
      </div>

      <motion.div
        key={`${n}-${run}`}
        style={{ perspective: 1400, transformOrigin: 'left center' }}
        initial={{ rotateY: -55, opacity: 0, x: 30 }} animate={{ rotateY: 0, opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <div className="mb-5 text-center">
          <div className="label">Chapter {n + 1} of {story.chapters.length}</div>
          <h1 className="mt-1 text-2xl font-bold">{ch.title}</h1>
        </div>
        <SessionRunner
          key={`${n}-${run}`}
          spec={spec}
          onRestart={() => {
            discardDraft(draftKey);
            setRun((r) => r + 1);
          }}
          onQuit={() => navigate(`/stories/${story.id}`)}
          hint={
            saveable ? (
              <span className="flex items-center gap-1.5"><Save size={13} className="text-accent" /> Long chapter: your place is saved automatically. Use Stop &amp; save whenever you need a break.</span>
            ) : (
              <span>Type the page exactly as written. Take your time.</span>
            )
          }
          renderNotice={({ reward }) =>
            reward.bookCompleted ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card flex flex-wrap items-center gap-5 border-caret/50 p-5">
                <Cover story={story} done className="h-32 w-24" />
                <div>
                  <div className="label !text-caret">Book completed</div>
                  <div className="text-xl font-extrabold">You finished “{story.title}”</div>
                  <p className="text-sm text-muted">The cover has been added to your bookshelf.</p>
                </div>
              </motion.div>
            ) : reward.chapterUnlocked ? (
              <div className="card flex items-center gap-3 p-4 text-sm"><BookOpen size={18} className="text-accent" /> Chapter {n + 2} is unlocked: <strong>{story.chapters[n + 1].title}</strong></div>
            ) : null
          }
          renderActions={({ reward }) => (
            <>
              <button className="btn btn-ghost" onClick={() => setRun((r) => r + 1)}>Read again</button>
              {hasNext ? (
                <button className="btn btn-primary" onClick={() => navigate(`/stories/${story.id}/${n + 1}`)} autoFocus>Turn the page <ArrowRight size={16} /></button>
              ) : (
                <Link to={reward.bookCompleted ? '/stories' : `/stories/${story.id}`} className="btn btn-primary" autoFocus>{reward.bookCompleted ? 'Back to the bookshelf' : 'Back to the book'}</Link>
              )}
            </>
          )}
        />
      </motion.div>
    </div>
  );
}
