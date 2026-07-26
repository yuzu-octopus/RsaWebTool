import { useState, useReducer, useRef, useEffect } from 'react';
import { useAppContext } from './useAppContext';
import { useTimer } from './useTimer';
import { DEFAULT_SAGE_TIMEOUT, type SageResult } from './useSageMath';
import { testcaseGenerators, submitToFactorDB, autoDecrypt } from '../attacks';
import { isActualSuccess } from '../utils/sageOutput';
import { ProgressEstimator } from '../utils/progressEstimator';
import type { Attack } from '../types';

type ProgressAction =
  | { type: 'START' }
  | { type: 'PROGRESS'; pct: number; detail?: string }
  | { type: 'DONE' }
  | { type: 'ERROR' };
type ProgressState = { loading: boolean; pct: number; detail: string };
const initialProgress: ProgressState = { loading: false, pct: 0, detail: '' };
function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  switch (action.type) {
    case 'START': return { loading: true, pct: 0, detail: '' };
    case 'PROGRESS': return { ...state, pct: action.pct, detail: action.detail ?? state.detail };
    case 'DONE': return { loading: false, pct: 100, detail: '' };
    case 'ERROR': return { loading: false, pct: 0, detail: '' };
    default: return state;
  }
}

interface OutputCallbacks {
  setOutputResult: (result: string | null) => void;
  setOutputError: (error: string | null) => void;
  setOutputSource: (source: 'input' | 'magic' | 'calculator' | null) => void;
  addToHistory: (attackId: string, attackName: string, result: string, success: boolean) => void;
  showNotification: (message: string, severity?: 'success' | 'error' | 'info') => void;
  setInputValues: (values: Record<string, string>) => void;
}

type ExecuteFn = (code: string, timeout: number, signal?: AbortSignal) => Promise<SageResult>;
type RunAttackFn = (
  attackId: string,
  vals: Record<string, string>,
  onProgress?: (pct: number, detail?: string) => void,
) => Promise<string | null>;
type CancelRunFn = () => void;

export function shouldContinueRun(runId: number, currentRunId: number, signal: AbortSignal): boolean {
  return runId === currentRunId && !signal.aborted;
}

export function useAttackExecution(
  execute: ExecuteFn,
  runAttack: RunAttackFn,
  cancelCurrentRun: CancelRunFn,
  callbacks: OutputCallbacks,
) {
  const { selectedAttack, viewMode } = useAppContext();
  const { setOutputResult, setOutputError, setOutputSource, addToHistory, showNotification, setInputValues } = callbacks;

  const [progressState, dispatchProgress] = useReducer(progressReducer, initialProgress);
  const loading = progressState.loading;
  const progress = progressState.pct;
  const progressDetail = progressState.detail;
  const abortControllerRef = useRef<AbortController | null>(null);
  const attackIdRef = useRef<string | null>(null);
  const runIdRef = useRef(0);
  const [testcaseMsg, setTestcaseMsg] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const estimatorRef = useRef<ProgressEstimator | null>(null);
  if (estimatorRef.current === null) estimatorRef.current = new ProgressEstimator();
  const lastEtaUpdate = useRef(0);
  const ownershipRef = useRef<'input' | 'magic' | null>(null);
  const timer = useTimer();
  const [eta, setEta] = useState<string | null>(null);

  // Mounted ref cleanup — clears timeouts on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const id of timeoutIdsRef.current) clearTimeout(id);
      timeoutIdsRef.current = [];
    };
  }, []);

  // Abort execution when user navigates away from attack view
  useEffect(() => {
    if (viewMode !== 'attack') {
      abortControllerRef.current?.abort();
    }
  }, [viewMode]);

  const handleStop = () => {
    runIdRef.current++;
    abortControllerRef.current?.abort();
    cancelCurrentRun();
    dispatchProgress({ type: 'DONE' });
    setEta(null);
    timer.stop();
  };

  const handleGenerateTestcase = () => {
    const gen = selectedAttack && testcaseGenerators[selectedAttack.id];
    if (!gen) {
      setTestcaseMsg('No testcase generator for this attack');
      const id = setTimeout(() => { if (mountedRef.current) setTestcaseMsg(null); }, 2000);
      timeoutIdsRef.current.push(id);
      return;
    }
    const values = gen();
    setInputValues(values);
    setTestcaseMsg('Testcase generated');
    const id = setTimeout(() => { if (mountedRef.current) setTestcaseMsg(null); }, 2000);
    timeoutIdsRef.current.push(id);
  };

  const handleRun = async (attack: Attack, inputValues: Record<string, string>) => {
    setTestcaseMsg(null);
    const currentRunId = ++runIdRef.current;
    abortControllerRef.current?.abort();
    cancelCurrentRun();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    dispatchProgress({ type: 'START' });
    estimatorRef.current!.reset();
    setEta(null);
    timer.start();
    setOutputResult(null);
    setOutputError(null);
    ownershipRef.current = 'input';
    setOutputSource('input');
    const currentAttackId = attack.id;
    attackIdRef.current = currentAttackId;

    // Strip whitespace from input values (e.g. spaces in numbers pasted from websites).
    // For multiline fields, preserve newlines — they're used as value separators.
    const vals: Record<string, string> = {};
    const inputMap = new Map(attack.inputs.map(f => [f.name, f]));
    for (const [key, value] of Object.entries(inputValues)) {
      const field = inputMap.get(key);
      vals[key] = field?.multiline
        ? value.replace(/[^\S\n]/g, '')  // strip horizontal whitespace only, preserve newlines
        : value.replace(/\s/g, '');       // strip ALL whitespace for single-line inputs
    }

    const missingFields = attack.inputs
      .flatMap(f => (f.required !== false && !vals[f.name]?.trim()) ? [f.label || f.name] : []);
    if (missingFields.length > 0) {
      const msg = `Missing required inputs:\n${missingFields.map(f => `- ${f}`).join('\n')}`;
      if (!mountedRef.current) return;
      if (ownershipRef.current !== 'input') return;
      setOutputError(msg);
      if (!mountedRef.current) return;
      addToHistory(attack.id, attack.name, msg, false);
      return;
    }

    try {
      if (attack.frontendCheck) {
        const handleProgress = (pct: number, detail?: string) => {
          dispatchProgress({ type: 'PROGRESS', pct, detail });
          const est = estimatorRef.current!.update(pct);
          const now = Date.now();
          if (now - lastEtaUpdate.current > 500) {
            lastEtaUpdate.current = now;
            setEta(est.formattedEta);
          }
        };
        const preResult = await runAttack(attack.id, vals, handleProgress);
        if (!shouldContinueRun(currentRunId, runIdRef.current, controller.signal)) return;
        if (preResult !== null) {
          let displayPreResult = preResult;
          displayPreResult += '\nMETHOD=TYPESCRIPT';
          const decryptedPre = autoDecrypt(attack, vals, preResult);
          if (decryptedPre) displayPreResult += '\n\n## Decrypted message\n' + decryptedPre;
          if (!mountedRef.current) return;
          if (ownershipRef.current !== 'input') return;
          setOutputResult(displayPreResult);
          if (!mountedRef.current) return;
          addToHistory(attack.id, attack.name, preResult, isActualSuccess(preResult));
          const preSuccess = isActualSuccess(preResult);
          if (!mountedRef.current) return;
          showNotification(`${attack.name}: ${preSuccess ? 'success' : 'failed'}`, preSuccess ? 'success' : 'error');
          if (preSuccess) submitToFactorDB(attack, preResult, vals.n, showNotification);
          return;
        }
      }

      const code = attack.sageTemplate?.(vals);
      if (!shouldContinueRun(currentRunId, runIdRef.current, controller.signal)) return;
      if (!code) {
        if (!mountedRef.current) return;
        if (attack.frontendCheck) {
          setOutputError('Frontend check returned no result — no SageMath fallback available for this attack');
        } else {
          setOutputError('No SageMath template available for this attack');
        }
        return;
      }
      if (!shouldContinueRun(currentRunId, runIdRef.current, controller.signal)) return;
      const result = await execute(code, DEFAULT_SAGE_TIMEOUT, controller.signal);
      if (!shouldContinueRun(currentRunId, runIdRef.current, controller.signal)) return;
      if (result.success) {
        let displayStdout = result.stdout;
        displayStdout += '\nMETHOD=SAGEMATHCELL';
        const decryptedSage = autoDecrypt(attack, vals, result.stdout);
        if (decryptedSage) displayStdout += '\n\n## Decrypted message\n' + decryptedSage;
        if (!mountedRef.current) return;
        if (ownershipRef.current !== 'input') return;
        setOutputResult(displayStdout);
        if (!mountedRef.current) return;
        addToHistory(attack.id, attack.name, result.stdout, isActualSuccess(result.stdout));
        const runSuccess = isActualSuccess(result.stdout);
        if (!mountedRef.current) return;
        showNotification(`${attack.name}: ${runSuccess ? 'success' : 'failed'}`, runSuccess ? 'success' : 'error');
        if (runSuccess) submitToFactorDB(attack, result.stdout, vals.n, showNotification);
      } else {
        if (!mountedRef.current) return;
        if (ownershipRef.current !== 'input') return;
        setOutputError(result.error || 'SageCell execution failed with no specific error. Check that all required inputs are filled.');
        if (!mountedRef.current) return;
        addToHistory(attack.id, attack.name, result.error || 'SageCell execution failed with no specific error. Check that all required inputs are filled.', false);
      }
    } catch (err: unknown) {
      if (!shouldContinueRun(currentRunId, runIdRef.current, controller.signal)) return;
      const message = err instanceof Error ? err.message : 'Execution failed';
      if (!mountedRef.current) return;
      if (ownershipRef.current !== 'input') return;
      setOutputError(message);
      if (!mountedRef.current) return;
      addToHistory(attack.id, attack.name, message, false);
    } finally {
      if (currentRunId === runIdRef.current) {
        dispatchProgress({ type: 'DONE' });
        setEta(null);
        timer.stop();
        abortControllerRef.current = null;
        if (ownershipRef.current === 'input') {
          ownershipRef.current = null;
          setOutputSource(null);
        }
      }
    }
  };

  return {
    handleRun,
    handleStop,
    handleGenerateTestcase,
    testcaseMsg,
    setTestcaseMsg,
    isRunning: loading && progress < 100,
    loading,
    progress,
    progressDetail,
    timer,
    eta,
    dispatchProgress,
    abortControllerRef,
    ownershipRef,
    attackIdRef,
    mountedRef,
    timeoutIdsRef,
  };
}
