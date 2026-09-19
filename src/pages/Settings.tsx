import { useRef, useState } from 'react';
import { Check, Download, Lock, RotateCcw, ShieldCheck, Upload, Volume2 } from 'lucide-react';
import { useStore, currentLevel } from '../store';
import { PageHeader, Modal, Segmented, Toggle } from '../components/ui';
import { THEMES } from '../lib/themes';
import { playChime, playError, playKey } from '../lib/audio';
import { FREEZE_COST, MAX_FREEZES } from '../store/defaults';
import { toDateStr } from '../lib/date';

function Section({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  return (
    <section className="card p-5" aria-labelledby={id}>
      <h2 id={id} className="mb-3 text-base font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const profile = useStore((s) => s.profile);
  const setSettings = useStore((s) => s.setSettings);
  const setDailyGoal = useStore((s) => s.setDailyGoal);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const resetAll = useStore((s) => s.resetAll);
  const level = currentLevel({ profile });

  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyflow-backup-${toDateStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: 'Backup downloaded. Keep it somewhere safe — you can import it on any device.' });
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 8_000_000) {
      setMsg({ ok: false, text: 'That file is too large to be a Keyflow backup.' });
      return;
    }
    setPending(await f.text());
  };

  const doImport = () => {
    if (pending === null) return;
    const r = importData(pending);
    setPending(null);
    setMsg(r.ok ? { ok: true, text: 'Progress imported successfully.' } : { ok: false, text: r.error });
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Make Keyflow feel right for you." />
      <div className="space-y-5">
        <Section title="Theme" id="s-theme">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Theme">
            {THEMES.map((t) => {
              const locked = t.unlockLevel > level;
              const active = settings.theme === t.id;
              return (
                <button
                  key={t.id} role="radio" aria-checked={active} disabled={locked}
                  onClick={() => setSettings({ theme: t.id })}
                  className={`relative overflow-hidden rounded-xl border-2 p-3 text-left transition disabled:opacity-60 ${active ? 'border-accent' : 'border-line hover:border-muted'}`}
                  style={{ background: t.swatch[0] }}
                >
                  <div className="mb-2 flex gap-1.5">
                    <span className="h-3 w-8 rounded-full" style={{ background: t.swatch[2] }} />
                    <span className="h-3 w-3 rounded-full" style={{ background: t.swatch[3] }} />
                    <span className="h-3 w-5 rounded-full" style={{ background: t.swatch[1] }} />
                  </div>
                  <div className="text-sm font-semibold" style={{ color: t.swatch[2] }}>{t.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: t.swatch[2], opacity: 0.8 }}>
                    {locked ? <><Lock size={11} /> Unlocks at level {t.unlockLevel}</> : active ? <><Check size={11} /> In use</> : 'Available'}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">Earn XP to level up and unlock more themes.</p>
        </Section>

        <Section title="Typing" id="s-typing">
          <label className="block">
            <div className="mb-1 flex items-center justify-between text-sm font-medium"><span>Text size</span><span className="tabular text-muted">{settings.fontSize}px</span></div>
            <input type="range" min={22} max={44} step={2} value={settings.fontSize} onChange={(e) => setSettings({ fontSize: +e.target.value })} className="w-full accent-[var(--accent)]" />
          </label>
          <div className="typing mt-3 overflow-hidden rounded-xl bg-bg p-4" aria-hidden="true">
            <span className="text-fg">the quick brown </span><span className="text-untyped">fox jumps over</span>
          </div>
          <div className="mt-5">
            <div className="mb-1.5 text-sm font-medium">Reduce motion</div>
            <Segmented
              label="Reduce motion" value={settings.reducedMotion} onChange={(v) => setSettings({ reducedMotion: v })}
              options={[{ value: 'system', label: 'Follow system' }, { value: 'on', label: 'Always reduce' }, { value: 'off', label: 'Never reduce' }]}
            />
            <p className="mt-1 text-xs text-muted">Turns off caret glide, confetti, flame flicker and page transitions.</p>
          </div>
          <div className="mt-5">
            <div className="mb-1.5 text-sm font-medium">Daily goal</div>
            <Segmented label="Daily goal in minutes" value={profile.dailyGoalMinutes} onChange={setDailyGoal} options={[5, 10, 15, 20, 30].map((m) => ({ value: m, label: `${m} min` }))} />
          </div>
        </Section>

        <Section title="Sound" id="s-sound">
          <Toggle checked={settings.sound} onChange={(v) => { setSettings({ sound: v }); if (v) window.setTimeout(playKey, 60); }} label="Mechanical keyboard sounds" description="Key clicks with a touch of random pitch, an error thud and milestone chimes." />
          <div className={settings.sound ? '' : 'pointer-events-none opacity-50'}>
            <label className="mt-2 block">
              <div className="mb-1 flex items-center justify-between text-sm font-medium"><span className="flex items-center gap-1.5"><Volume2 size={15} /> Volume</span><span className="tabular text-muted">{Math.round(settings.volume * 100)}%</span></div>
              <input type="range" min={0} max={1} step={0.05} value={settings.volume} onChange={(e) => setSettings({ volume: +e.target.value })} className="w-full accent-[var(--accent)]" onPointerUp={() => playKey()} />
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-ghost !py-1.5" onClick={playKey}>Key click</button>
              <button className="btn btn-ghost !py-1.5" onClick={playError}>Mistake</button>
              <button className="btn btn-ghost !py-1.5" onClick={playChime}>Chime</button>
            </div>
          </div>
        </Section>

        <Section title="Your data" id="s-data">
          <p className="flex items-start gap-2 text-sm text-muted"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-success" /> Everything — sessions, streaks, badges — is stored only in this browser. There is no account and nothing is uploaded. Export a backup to move to another device or keep your progress safe.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={download}><Download size={16} /> Export progress</button>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> Import progress</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} aria-label="Choose a Keyflow backup file" />
            <button className="btn btn-danger" onClick={() => setConfirmReset(true)}><RotateCcw size={16} /> Reset all data</button>
          </div>
          {msg && <p role="status" className={`mt-3 text-sm ${msg.ok ? 'text-success' : 'text-err'}`}>{msg.text}</p>}
          <p className="mt-3 text-xs text-muted">Streak freezes cost {FREEZE_COST} XP each (max {MAX_FREEZES} held) — buy them on the Home screen.</p>
        </Section>

        <p className="pb-4 text-center text-xs text-muted">Keyflow 1.0 · Works offline once loaded · Find your flow. One keystroke at a time.</p>
      </div>

      <Modal
        open={pending !== null} onClose={() => setPending(null)} title="Replace your progress?"
        actions={<><button className="btn btn-ghost" onClick={() => setPending(null)}>Cancel</button><button className="btn btn-primary" onClick={doImport}>Import &amp; replace</button></>}
      >
        Importing replaces everything currently saved in this browser with the contents of the backup file. Consider exporting your current progress first.
      </Modal>
      <Modal
        open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset all data?"
        actions={<><button className="btn btn-ghost" onClick={() => setConfirmReset(false)}>Keep my data</button><button className="btn btn-danger" onClick={() => { resetAll(); setConfirmReset(false); setMsg({ ok: true, text: 'All progress has been reset.' }); }}>Yes, reset everything</button></>}
      >
        This permanently deletes your sessions, streak, XP, badges and story/lesson progress from this browser. It cannot be undone — export a backup first if you might want it back.
      </Modal>
    </div>
  );
}
