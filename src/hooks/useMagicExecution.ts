import { useState, useRef, useReducer, useCallback, useEffect } from 'react';
import { useAppContext } from './useAppContext';
import { useSageMathParallel, DEFAULT_SAGE_TIMEOUT } from './useSageMath';
import { useTimer } from './useTimer';
import { useWorkerPool } from './useWorkerPool';
import { attacks, submitToFactorDB, autoDecrypt } from '../attacks';
import { isActualSuccess } from '../utils/sageOutput';
import { generateKeyPair, encrypt, TESTCASE_BITS } from '../utils/testcases/core';
import type { Attack } from '../types';

// --- Types ---

export interface MagicJob {
  attackId: string;
  attackName: string;
  status: 'running' | 'success' | 'error' | 'aborted' | 'cancelled';
  result?: string;
  error?: string;
}

type ExecutionAction =
  | { type: 'START_EXECUTION' }
  | { type: 'SET_EARLY_STOP' }
  | { type: 'SET_ERROR_INSIGHTS'; insights: string | null }
  | { type: 'FINISH' };

type ExecutionState = {
  running: boolean;
  earlyStop: boolean;
  errorInsights: string | null;
};

const initialExecState: ExecutionState = { running: false, earlyStop: false, errorInsights: null };

function execReducer(state: ExecutionState, action: ExecutionAction): ExecutionState {
  switch (action.type) {
    case 'START_EXECUTION': return { ...initialExecState, running: true };
    case 'SET_EARLY_STOP': return { ...state, earlyStop: true };
    case 'SET_ERROR_INSIGHTS': return { ...state, errorInsights: action.insights };
    case 'FINISH': return { ...state, running: false };
    default: return state;
  }
}

/**
 * Build error insights summary from frontendCheck and (optionally) SageCell results.
 */
function buildErrorInsights(
  preCheckResults: ({ result?: string; error?: string; isSuccess?: boolean } | null)[],
  sageResults?: { success: boolean; stdout: string; error?: string }[],
): string | null {
  const errParts: string[] = [];
  const seenLabels = new Set<string>();
  for (const r of preCheckResults) {
    if (r?.error) {
      const label = r.error.includes('timed out') ? 'frontendCheck timed out' : 'frontendCheck error';
      if (!seenLabels.has(label)) {
        seenLabels.add(label);
        errParts.push(label);
      }
    }
  }
  if (sageResults) {
    const sageTimeouts = sageResults.filter(r => !r.success && r.error?.includes('timed out')).length;
    const sageErrors = sageResults.filter(r => !r.success && r.error && !r.error.includes('timed out')).length;
    if (sageTimeouts > 0) errParts.push(`${sageTimeouts} SageCell timed out`);
    if (sageErrors > 0) errParts.push(`${sageErrors} execution errors`);
  }
  return errParts.length > 0 ? errParts.join(', ') : null;
}

// --- Hook ---

export function useMagicExecution(
  applicable: Attack[],
  paramsFromInput: Record<string, string> | null,
  setRawInput: (value: string) => void,
) {
  const { setOutputResult, setOutputError, addToHistory, showNotification } = useAppContext();
  const { executeAll, createController } = useSageMathParallel();
  const { runAttack, cancelCurrentRun } = useWorkerPool();
  const timer = useTimer();

  const [jobs, setJobs] = useState<MagicJob[]>([]);
  const [execState, dispatchExec] = useReducer(execReducer, initialExecState);
  const { running, earlyStop, errorInsights } = execState;

  const abortControllerRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const stopRequestedRef = useRef(false);
  const testcaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [testcaseMsg, setTestcaseMsg] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const handleToggleJob = useCallback((attackId: string) => {
    setExpandedJob(prev => prev === attackId ? null : attackId);
  }, []);

  const [displayedPct, setDisplayedPct] = useState(0);
  const displayedPctRef = useRef(0);

  // Cleanup testcase timer on unmount
  useEffect(() => {
    return () => {
      if (testcaseTimerRef.current) clearTimeout(testcaseTimerRef.current);
    };
  }, []);

  // Smooth progress catch-up: displayed progress lags behind actual
  useEffect(() => {
    const actualPct = jobs.length > 0 ? (jobs.filter(j => j.status !== 'running').length / jobs.length) * 100 : 0;
    if (actualPct !== displayedPctRef.current) {
      const rafId = requestAnimationFrame(() => {
        const current = displayedPctRef.current;
        const diff = actualPct - current;
        if (Math.abs(diff) < 1) {
          displayedPctRef.current = actualPct;
          setDisplayedPct(actualPct);
        } else {
          displayedPctRef.current = current + (diff > 0 ? Math.max(1, Math.ceil(diff / 3)) : Math.min(-1, Math.floor(diff / 3)));
          setDisplayedPct(displayedPctRef.current);
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [jobs]);

  // --- Internal execution functions ---

  const runFrontendCheckPhase = async (
    applicableAttacks: Attack[],
    params: Record<string, string>,
    runId: number,
    preCheckResults: ({ result?: string; error?: string; isSuccess?: boolean } | null)[],
    earlySuccess: { value: { index: number; attack: Attack; result: string } | null },
  ): Promise<{ stopped: boolean }> => {
    await new Promise<void>((resolveAll) => {
      let completed = 0;
      const total = applicableAttacks.length;

      for (let i = 0; i < total; i++) {
        const a = applicableAttacks[i];
        const idx = i;

        runAttack(a.id, params)
          .then(result => {
            if (runId !== runIdRef.current) return;
            if (earlySuccess.value) return;

            completed++;
            if (result !== null) {
              const isSuccess = isActualSuccess(result);
              preCheckResults[idx] = { result, isSuccess };
              setJobs(prev => {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], status: isSuccess ? 'success' : 'error', result };
                return updated;
              });

              if (isSuccess) {
                earlySuccess.value = { index: idx, attack: a, result };
                cancelCurrentRun();
                resolveAll();
                return;
              }
            } else {
              // frontendCheck returned null (not applicable) — mark aborted so progress bar advances
              setJobs(prev => {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], status: 'aborted' as const };
                return updated;
              });
            }

            if (completed >= total) resolveAll();
          })
          .catch(err => {
            if (runId !== runIdRef.current) return;
            if (earlySuccess.value) return;

            completed++;
            const error = err instanceof Error ? err.message : 'Unknown frontendCheck error';
            preCheckResults[idx] = { error };
            setJobs(prev => {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], status: 'error', error };
              return updated;
            });

            if (completed >= total) resolveAll();
          });
      }
    });

    if (runId !== runIdRef.current) return { stopped: true };

    // If user pressed Stop during frontendCheck phase, bail out immediately
    if (stopRequestedRef.current) {
      stopRequestedRef.current = false;
      setJobs(prev => prev.map(j => j.status === 'running' ? { ...j, status: 'cancelled' as const } : j));
      if (runId === runIdRef.current) {
        timer.stop();
        dispatchExec({ type: 'FINISH' });
        abortControllerRef.current = null;
      }
      return { stopped: true };
    }

    // Mark any remaining running jobs as aborted (in-flight workers were cancelled)
    setJobs(prev => prev.map(j => j.status === 'running' ? { ...j, status: 'aborted' as const } : j));
    return { stopped: false };
  };

  const surfaceFrontendSuccess = (
    success: { index: number; attack: Attack; result: string },
    params: Record<string, string>,
  ): void => {
    timer.stop();
    dispatchExec({ type: 'FINISH' });
    abortControllerRef.current = null;
    let displayResult = success.result;
    displayResult += '\nMETHOD=TYPESCRIPT';
    const decrypted = autoDecrypt(success.attack, params, success.result);
    if (decrypted) displayResult += '\n\n## Decrypted message\n' + decrypted;
    setOutputResult(displayResult);
    addToHistory(success.attack.id, success.attack.name, success.result, true);
    showNotification(`${success.attack.name}: success`, 'success');
    submitToFactorDB(success.attack, success.result, params.n, showNotification);
    if (decrypted) {
      setJobs(prev => prev.map(j =>
        j.attackId === success.attack.id ? { ...j, result: displayResult } : j
      ));
    }
  };

  const runSageCellPhase = async (
    remaining: { attack: Attack; originalIndex: number }[],
    preCheckResults: ({ result?: string; error?: string; isSuccess?: boolean } | null)[],
    params: Record<string, string>,
    runId: number,
    controller: AbortController,
    applicableAttacks: Attack[],
  ): Promise<void> => {
    const codes = remaining.flatMap(r => {
      const code = r.attack.sageTemplate?.(params);
      return code ? [code] : [];
    });

    try {
      if (runId !== runIdRef.current) return;
      const results = await executeAll(codes, 3, DEFAULT_SAGE_TIMEOUT, (remainingIndex, result) => {
        if (runId !== runIdRef.current) return true;
        const originalIndex = remaining[remainingIndex].originalIndex;
        const jobStatus: MagicJob['status'] = result.success && isActualSuccess(result.stdout) ? 'success' : 'error';
        setJobs(prev => {
          const updated = [...prev];
          updated[originalIndex] = { ...updated[originalIndex], status: jobStatus, result: result.stdout, error: result.error };
          return updated;
        });
        if (result.success && isActualSuccess(result.stdout)) {
          dispatchExec({ type: 'SET_EARLY_STOP' });
          return true;
        }
        return false;
      }, controller);

      if (runId !== runIdRef.current) return;

      // Mark un-reached jobs as aborted (early stop)
      setJobs(prev => prev.map(j => j.status === 'running' ? { ...j, status: 'aborted' as const } : j));

      // Find and surface first success
      const firstSuccessResult = results.find(r => r.success && isActualSuccess(r.stdout));
      if (firstSuccessResult) {
        const ri = remaining[firstSuccessResult.index];
        const attack = attacks.find(a => a.id === applicableAttacks[ri.originalIndex].id);
        if (attack) {
          let displayResult = firstSuccessResult.stdout;
          displayResult += '\nMETHOD=SAGEMATHCELL';
          const decrypted = autoDecrypt(attack, params, firstSuccessResult.stdout);
          if (decrypted) displayResult += '\n\n## Decrypted message\n' + decrypted;
          setOutputResult(displayResult);
          addToHistory(attack.id, attack.name, firstSuccessResult.stdout, true);
          showNotification(`${attack.name}: success`, 'success');
          submitToFactorDB(attack, firstSuccessResult.stdout, params.n, showNotification);
          if (decrypted) {
            setJobs(prev => prev.map(j =>
              j.attackId === attack.id ? { ...j, result: displayResult } : j
            ));
          }
        }
      } else {
        dispatchExec({ type: 'SET_ERROR_INSIGHTS', insights: buildErrorInsights(preCheckResults, results) });
      }
    } catch (err: unknown) {
      if (runId !== runIdRef.current) return;
      const message = err instanceof Error ? err.message : 'Magic cracker failed';
      setOutputError(message);
    } finally {
      if (runId === runIdRef.current) {
        timer.stop();
        dispatchExec({ type: 'FINISH' });
        abortControllerRef.current = null;
      }
    }
  };

  // --- Public handlers ---

  const handleCrack = useCallback(async () => {
    abortControllerRef.current?.abort();
    const currentRunId = ++runIdRef.current;
    stopRequestedRef.current = false;
    const controller = createController();
    abortControllerRef.current = controller;
    dispatchExec({ type: 'START_EXECUTION' });
    timer.start();
    setJobs([]);
    setOutputResult(null);
    setOutputError(null);
    setDisplayedPct(0);
    displayedPctRef.current = 0;
    dispatchExec({ type: 'SET_ERROR_INSIGHTS', insights: null });

    const params = paramsFromInput ?? {};
    const attacksToRun = applicable;

    const initialJobs: MagicJob[] = attacksToRun.map(a => ({
      attackId: a.id,
      attackName: a.name,
      status: 'running',
    }));
    setJobs(initialJobs);

    const preCheckResults: ({ result?: string; error?: string; isSuccess?: boolean } | null)[] = [];
    const earlySuccess: { value: { index: number; attack: Attack; result: string } | null } = { value: null };

    if (currentRunId !== runIdRef.current) return;

    const { stopped } = await runFrontendCheckPhase(attacksToRun, params, currentRunId, preCheckResults, earlySuccess);
    if (stopped) return;

    const success = earlySuccess.value;
    if (success) {
      surfaceFrontendSuccess(success, params);
      return;
    }

    // Build remaining list (attacks that need SageCell)
    const remaining: { attack: Attack; originalIndex: number }[] = [];
    for (let i = 0; i < attacksToRun.length; i++) {
      if (!preCheckResults[i]) {
        remaining.push({ attack: attacksToRun[i], originalIndex: i });
      }
    }

    // If all attacks resolved by frontendCheck (no success), short-circuit
    if (remaining.length === 0) {
      if (currentRunId !== runIdRef.current) return;
      timer.stop();
      dispatchExec({ type: 'FINISH' });
      abortControllerRef.current = null;
      dispatchExec({ type: 'SET_ERROR_INSIGHTS', insights: buildErrorInsights(preCheckResults) });
      return;
    }

    await runSageCellPhase(remaining, preCheckResults, params, currentRunId, controller, attacksToRun);
  // Internal functions (runFrontendCheckPhase, surfaceFrontendSuccess, runSageCellPhase)
  // use refs and are stable across renders — omitted from deps intentionally
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicable, paramsFromInput, createController, timer, executeAll, runAttack, cancelCurrentRun, setOutputResult, setOutputError, addToHistory, showNotification]);

  const handleStop = useCallback(() => {
    stopRequestedRef.current = true;
    abortControllerRef.current?.abort();
    cancelCurrentRun();
  }, [cancelCurrentRun]);

  const handleGenerateTestcase = useCallback(() => {
    if (testcaseTimerRef.current) clearTimeout(testcaseTimerRef.current);
    const { p, q, n, e, d } = generateKeyPair(TESTCASE_BITS.p, TESTCASE_BITS.q);
    // Use crypto.getRandomValues for unbiased random message
    const rand = new Uint32Array(1);
    crypto.getRandomValues(rand);
    const m = BigInt(rand[0] % 1000000) + 42n;
    const c = encrypt(m, n, e);
    const dp = d % (p - 1n);
    const dq = d % (q - 1n);

    const lines = [
      `n = ${n}`,
      `e = ${e}`,
      `c = ${c}`,
      `d = ${d}`,
      `p = ${p}`,
      `q = ${q}`,
      `dp = ${dp}`,
      `dq = ${dq}`,
      `phi = ${(p - 1n) * (q - 1n)}`,
    ];
    setRawInput(lines.join('\n'));
    setTestcaseMsg('Testcase generated — click Crack It to try all applicable attacks');
    testcaseTimerRef.current = setTimeout(() => setTestcaseMsg(null), 3000);
  }, [setRawInput]);

  return {
    running,
    earlyStop,
    errorInsights,
    jobs,
    setJobs,
    displayedPct,
    testcaseMsg,
    setTestcaseMsg,
    expandedJob,
    handleToggleJob,
    timer,
    handleCrack,
    handleStop,
    handleGenerateTestcase,
  };
}
