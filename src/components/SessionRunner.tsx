import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useBlocker } from 'react-router-dom';
import type { EngineResult, EngineSnapshot } from '../lib/engine';
import type { Ghost, Mode, Reward, SessionRef } from '../types';
import { useStore } from '../store';
import { useUi } from '../store/ui';
import { TypingSession, type KeyboardOpts } from './TypingSession';
import { ResultsView } from './ResultsView';
import { Modal } from './ui';

export interface RunnerSpec {
  text: string;
  timeLimit?: number;
  extendWords?: () => string;
  autoIndent?: boolean;
  ghost?: Ghost | null;
  countdown?: boolean;
  zen?: boolean;
  keyboard?: KeyboardOpts;
  mode: Mode;
  modeKey: string;
  ref?: SessionRef;
  tag?: 'baseline';
  keepGhost?: boolean;
  /** label on the results screen and share card */
  label: string;
  /** set for long texts: enables Stop & save, autosave and resuming */
  draft?: {
    key: string;
    /** hash of the text, stored with the draft so an edited chapter never resumes from a stale spot */
    sig: number;
    textLength: number;
    /** the saved run to resume, if there is one */
    resume: EngineSnapshot | null;
    /** called after the reader chose "Stop & save" (leave the page) */
    onStopped: () => void;
  };
}

export interface Outcome {
  result: EngineResult;
  reward: Reward;
}

interface Props {
  spec: RunnerSpec;
  onRestart: () => void;
  onQuit?: () => void;
  hint?: ReactNode;
  /** buttons under the results */
  renderActions: (o: Outcome) => ReactNode;
  /** extra banner above the graph (lesson pass/fail, benchmark…) */
  renderNotice?: (o: Outcome) => ReactNode;
  /** called right after the session is recorded */
  onComplete?: (o: Outcome) => void;
  compactResults?: boolean;
}

/**
 * Runs one typing session, records it through the store's single
 * `completeSession`, then shows the results screen. Leaving mid-run asks first.
 */
export function SessionRunner({ spec, onRestart, onQuit, hint, renderActions, renderNotice, onComplete, compactResults }: Props) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const inProgress = useRef(false);
  const completeSession = useStore((s) => s.completeSession);
  const saveDraftAction = useStore((s) => s.saveDraft);
  const showNotice = useUi((s) => s.showNotice);
  const saveFn = useRef<(() => void) | null>(null);
  const lastSave = useRef<{ streak: number; streakIncremented: boolean } | null>(null);
  const draft = spec.draft;
  const draftKey = draft?.key;
  const draftSig = draft?.sig ?? 0;
  const draftLength = draft?.textLength ?? 0;

  const blocker = useBlocker(() => inProgress.current);

  const onProgress = useCallback((p: boolean) => {
    inProgress.current = p;
  }, []);

  const registerSave = useCallback((fn: (() => void) | null) => {
    saveFn.current = fn;
  }, []);

  const onSaveDraft = useCallback(
    (snap: EngineSnapshot) => {
      if (draftKey) lastSave.current = saveDraftAction(draftKey, draftSig, draftLength, snap);
    },
    [draftKey, draftSig, draftLength, saveDraftAction],
  );

  const savedMessage = () =>
    lastSave.current?.streakIncremented
      ? `Progress saved. Your streak is now ${lastSave.current.streak} day${lastSave.current.streak === 1 ? '' : 's'}!`
      : 'Progress saved. You can resume from this exact spot any time.';

  const onStopped = useCallback(() => {
    inProgress.current = false;
    showNotice(savedMessage());
    draft?.onStopped();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, showNotice]);

  const onFinish = useCallback(
    (result: EngineResult) => {
      inProgress.current = false;
      const reward = completeSession({
        result,
        mode: spec.mode,
        modeKey: spec.modeKey,
        ref: spec.ref,
        tag: spec.tag,
        keepGhost: spec.keepGhost,
      });
      const o = { result, reward };
      setOutcome(o);
      onComplete?.(o);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    // spec fields are stable for the lifetime of a run (parent remounts on restart)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [completeSession],
  );

  // Saveable chapters go through the leave dialog (which offers "Save & leave"); others just quit.
  const quit = onQuit
    ? draft
      ? onQuit
      : () => {
          inProgress.current = false;
          onQuit();
        }
    : undefined;

  return (
    <>
      {outcome ? (
        <ResultsView
          result={outcome.result}
          reward={outcome.reward}
          label={spec.label}
          actions={renderActions(outcome)}
          notice={renderNotice?.(outcome)}
          compact={compactResults}
        />
      ) : (
        <TypingSession
          text={spec.text}
          timeLimit={spec.timeLimit}
          extendWords={spec.extendWords}
          autoIndent={spec.autoIndent}
          ghost={spec.ghost}
          countdown={spec.countdown}
          zen={spec.zen}
          keyboard={spec.keyboard}
          onFinish={onFinish}
          onRestart={onRestart}
          onQuit={quit}
          onProgress={onProgress}
          hint={hint}
          saveable={!!draft}
          resumeFrom={draft?.resume ?? null}
          onSaveDraft={onSaveDraft}
          onStopped={onStopped}
          registerSave={registerSave}
        />
      )}

      <Modal
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title={draft ? 'Leave this chapter?' : 'Leave this session?'}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => blocker.reset?.()}>Keep typing</button>
            {draft && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  saveFn.current?.();
                  inProgress.current = false;
                  showNotice(savedMessage());
                  blocker.proceed?.();
                }}
              >
                Save &amp; leave
              </button>
            )}
            <button className="btn btn-danger" onClick={() => blocker.proceed?.()}>{draft ? 'Leave without saving' : 'Discard & leave'}</button>
          </>
        }
      >
        {draft
          ? 'Save your place and you can pick this chapter up from exactly where you stopped. Leaving without saving loses what you typed since your last save.'
          : 'Your run is in progress. If you leave now it will not be saved — no penalty to your streak, and you can start a fresh one any time.'}
      </Modal>
    </>
  );
}
