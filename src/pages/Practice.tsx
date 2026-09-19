import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Code2, Crosshair, Flower2, Ghost as GhostIcon, Hash, Pencil, Quote, Timer, Type, FileText, Play } from 'lucide-react';
import { useStore } from '../store';
import { SessionRunner, type RunnerSpec } from '../components/SessionRunner';
import { Segmented } from '../components/ui';
import { codeSnippet, generateWords, quoteFor, weakKeyText, zenPassage } from '../lib/text';
import { random } from '../lib/rng';
import { normalizeText } from '../lib/engine';
import { LANG_LABEL, type CodeLang } from '../data/code';
import type { PracticeMode, Prefs } from '../types';

const MODES: { id: PracticeMode; label: string; icon: typeof Timer }[] = [
  { id: 'time', label: 'Time', icon: Timer },
  { id: 'words', label: 'Words', icon: Type },
  { id: 'quote', label: 'Quote', icon: Quote },
  { id: 'zen', label: 'Zen', icon: Flower2 },
  { id: 'custom', label: 'Custom', icon: FileText },
  { id: 'code', label: 'Code', icon: Code2 },
  { id: 'weak', label: 'Weak keys', icon: Crosshair },
];

const MAX_CUSTOM = 10000;

export function PracticePage() {
  const prefs = useStore((s) => s.prefs);
  const setPrefs = useStore((s) => s.setPrefs);
  const records = useStore((s) => s.records);
  const keyStats = useStore((s) => s.totals.keyStats);
  const [params, setParams] = useSearchParams();
  const [run, setRun] = useState(0);
  const [draft, setDraft] = useState(prefs.customText);
  const [keepBreaks, setKeepBreaks] = useState(false);
  const [customText, setCustomText] = useState<string | null>(null);
  const [customError, setCustomError] = useState<string | null>(null);

  /* deep links from Home: /practice?mode=time&value=30 */
  useEffect(() => {
    const mode = params.get('mode') as PracticeMode | null;
    if (!mode || !MODES.some((m) => m.id === mode)) return;
    const value = params.get('value');
    const patch: Partial<Prefs> = { mode };
    if (mode === 'time' && value && [15, 30, 60, 120].includes(+value)) patch.time = +value;
    if (mode === 'words' && value && [10, 25, 50, 100].includes(+value)) patch.words = +value;
    if (mode === 'quote' && (value === 'short' || value === 'medium' || value === 'long')) patch.quote = value;
    setPrefs(patch);
    setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opts = { difficulty: prefs.difficulty, punctuation: prefs.punctuation, numbers: prefs.numbers } as const;
  const optKey = `${prefs.punctuation ? '+p' : ''}${prefs.numbers ? '+n' : ''}${prefs.difficulty !== 'mixed' ? `+${prefs.difficulty}` : ''}`;

  // Everything that changes the generated text also remounts the runner (fresh engine).
  const sig = [prefs.mode, prefs.time, prefs.words, prefs.quote, prefs.codeLang, prefs.ghost, optKey, run, keepBreaks, customText?.length ?? 0].join('|');

  const built = useMemo((): { spec: RunnerSpec; note?: string } | null => {
    switch (prefs.mode) {
      case 'time': {
        const modeKey = `time-${prefs.time}${optKey}`;
        return {
          spec: {
            text: generateWords(50, random, opts),
            extendWords: () => generateWords(30, random, opts),
            timeLimit: prefs.time, mode: 'time', modeKey, keepGhost: true,
            ghost: prefs.ghost ? records.ghosts[modeKey] ?? null : null,
            label: `${prefs.time} seconds${optKey.replace(/\+/g, ' · ')}`,
          },
        };
      }
      case 'words': {
        const modeKey = `words-${prefs.words}${optKey}`;
        return {
          spec: {
            text: generateWords(prefs.words, random, opts),
            mode: 'words', modeKey, keepGhost: true,
            ghost: prefs.ghost ? records.ghosts[modeKey] ?? null : null,
            label: `${prefs.words} words${optKey.replace(/\+/g, ' · ')}`,
          },
        };
      }
      case 'quote': {
        const q = quoteFor(prefs.quote, random);
        return { spec: { text: q.text, mode: 'quote', modeKey: `quote-${prefs.quote}`, label: `${prefs.quote[0].toUpperCase()}${prefs.quote.slice(1)} quote` }, note: `— ${q.author}` };
      }
      case 'zen':
        return { spec: { text: zenPassage(random), mode: 'zen', modeKey: 'zen', zen: true, label: 'Zen mode' } };
      case 'code': {
        const s = codeSnippet(prefs.codeLang, random);
        return { spec: { text: s.code, autoIndent: true, mode: 'code', modeKey: `code-${s.lang}`, label: `Code · ${LANG_LABEL[s.lang]}` }, note: LANG_LABEL[s.lang] };
      }
      case 'weak': {
        const w = weakKeyText(keyStats, 40, random);
        return {
          spec: { text: w.text, mode: 'words', modeKey: 'weak-drill', label: 'Weak-key drill' },
          note: `Targeting: ${w.keys.map((k) => k.toUpperCase()).join(' ')}${w.personalised ? '' : ' (warm-up set — play more sessions to personalise)'}`,
        };
      }
      case 'custom':
        return customText
          ? { spec: { text: customText, autoIndent: keepBreaks, mode: 'custom', modeKey: 'custom', label: 'Custom text' } }
          : null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const startCustom = () => {
    const t = normalizeText(draft, { keepNewlines: keepBreaks }).slice(0, MAX_CUSTOM);
    if (t.length < 15) {
      setCustomError('Add a little more text — at least 15 characters (about a sentence).');
      return;
    }
    setCustomError(null);
    setPrefs({ customText: draft.slice(0, MAX_CUSTOM) });
    setCustomText(t);
    setRun((r) => r + 1);
  };

  const restart = () => setRun((r) => r + 1);
  const ghostInfo = built?.spec.ghost;

  return (
    <div>
      <div className="chrome card mb-6 space-y-3 p-3 sm:p-4">
        <div role="tablist" aria-label="Practice mode" className="flex flex-wrap gap-1">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id} role="tab" aria-selected={prefs.mode === id} className="chip" data-active={prefs.mode === id}
              onClick={() => { setPrefs({ mode: id }); setRun((r) => r + 1); if (id === 'custom') setCustomText(null); }}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-3">
          {prefs.mode === 'time' && <Segmented label="Duration" value={prefs.time} onChange={(v) => setPrefs({ time: v })} options={[15, 30, 60, 120].map((v) => ({ value: v, label: `${v}s` }))} />}
          {prefs.mode === 'words' && <Segmented label="Word count" value={prefs.words} onChange={(v) => setPrefs({ words: v })} options={[10, 25, 50, 100].map((v) => ({ value: v, label: `${v}` }))} />}
          {prefs.mode === 'quote' && <Segmented label="Quote length" value={prefs.quote} onChange={(v) => setPrefs({ quote: v })} options={(['short', 'medium', 'long'] as const).map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />}
          {prefs.mode === 'code' && (
            <Segmented label="Language" value={prefs.codeLang} onChange={(v) => setPrefs({ codeLang: v as CodeLang | 'any' })} options={[{ value: 'any', label: 'Any' }, ...(Object.keys(LANG_LABEL) as CodeLang[]).map((v) => ({ value: v, label: LANG_LABEL[v] }))]} />
          )}
          {(prefs.mode === 'time' || prefs.mode === 'words') && (
            <>
              <div role="group" aria-label="Text options" className="flex items-center gap-1">
                <button className="chip" aria-pressed={prefs.punctuation} onClick={() => setPrefs({ punctuation: !prefs.punctuation })}><Hash size={15} /> Punctuation</button>
                <button className="chip" aria-pressed={prefs.numbers} onClick={() => setPrefs({ numbers: !prefs.numbers })}>123 Numbers</button>
              </div>
              <Segmented label="Word difficulty" value={prefs.difficulty} onChange={(v) => setPrefs({ difficulty: v })} options={[{ value: 'easy', label: 'Easy' }, { value: 'mixed', label: 'Mixed' }, { value: 'hard', label: 'Hard' }]} />
              <button className="chip" aria-pressed={prefs.ghost} onClick={() => setPrefs({ ghost: !prefs.ghost })} title="Race a marker that replays your personal best">
                <GhostIcon size={15} /> Ghost race
              </button>
            </>
          )}
          {prefs.mode === 'weak' && <span className="text-sm text-muted">Adaptive drill: words weighted toward the keys you miss or hit slowest.</span>}
          {prefs.mode === 'zen' && <span className="text-sm text-muted">No timer, no pressure. The background glows with your rhythm.</span>}
        </div>
      </div>

      {prefs.mode === 'custom' && !customText ? (
        <div className="card p-5">
          <label htmlFor="custom-text" className="label">Paste or write your own text</label>
          <textarea
            id="custom-text" value={draft} onChange={(e) => { setDraft(e.target.value); setCustomError(null); }} maxLength={MAX_CUSTOM * 2}
            rows={8} placeholder="Paste an article, a poem, lecture notes — anything you'd like to practise on…"
            className="mt-2 w-full resize-y rounded-xl border border-line bg-bg p-3 font-mono text-sm outline-none focus:border-accent"
            aria-describedby="custom-help"
          />
          <div id="custom-help" className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <span>
              {draft.length.toLocaleString()} characters{draft.length > MAX_CUSTOM ? ` — only the first ${MAX_CUSTOM.toLocaleString()} will be used` : ''}. Curly quotes and dashes are converted to keys you can type.
            </span>
            <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={keepBreaks} onChange={(e) => setKeepBreaks(e.target.checked)} /> Keep line breaks (for code)</label>
          </div>
          {customError && <p role="alert" className="mt-2 text-sm text-err">{customError}</p>}
          <button className="btn btn-primary mt-4" onClick={startCustom}><Play size={16} /> Start typing</button>
        </div>
      ) : built ? (
        <SessionRunner
          key={sig}
          spec={built.spec}
          onRestart={restart}
          hint={
            <span className="flex flex-wrap items-center gap-x-3">
              {built.note && <span className="italic">{built.note}</span>}
              {ghostInfo && <span className="flex items-center gap-1 text-accent2"><GhostIcon size={13} /> Racing your best: {Math.round(ghostInfo.wpm)} WPM</span>}
              {!built.note && !ghostInfo && <span>Start typing to begin — the clock starts on your first key.</span>}
            </span>
          }
          renderActions={() => (
            <>
              <button className="btn btn-primary" onClick={restart} autoFocus>Try again</button>
              {prefs.mode === 'custom' && <button className="btn btn-ghost" onClick={() => { setCustomText(null); }}><Pencil size={16} /> Edit text</button>}
              <Link to="/" className="btn btn-ghost">Home</Link>
            </>
          )}
        />
      ) : null}
    </div>
  );
}
