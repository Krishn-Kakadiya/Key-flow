import { useCallback, useRef, useState, type ReactNode } from 'react';
import { useBlocker } from 'react-router-dom';
import type { EngineResult } from '../lib/engine';
import type { Ghost, Mode, Reward, SessionRef } from '../types';
import { useStore } from '../store';
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

  const blocker = useBlocker(() => inProgress.current);

  const onProgress = useCallback((p: boolean) => {
    inProgress.current = p;
  }, []);

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

  const quit = onQuit
    ? () => {
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
        />
      )}

      <Modal
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title="Leave this session?"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => blocker.reset?.()}>Keep typing</button>
            <button className="btn btn-danger" onClick={() => blocker.proceed?.()}>Discard &amp; leave</button>
          </>
        }
      >
        Your run is in progress. If you leave now it will not be saved — no penalty to your streak, and you can start a fresh one any time.
      </Modal>
    </>
  );
}
