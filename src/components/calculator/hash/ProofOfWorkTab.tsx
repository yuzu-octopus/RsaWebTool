import { useState, useRef, useCallback } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Button } from '@astryxdesign/core/Button';
import { Selector } from '@astryxdesign/core/Selector';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Banner } from '@astryxdesign/core/Banner';
import { useWorkerPool } from '../../../hooks/useWorkerPool';
import { ProgressEstimator } from '../../../utils/progressEstimator';
import { useAppContext } from '../../../hooks/useAppContext';
import { ResultBox } from '../_shared/ResultBox';

const HASH_ALGORITHMS = [
  { value: 'SHA-256', label: 'SHA-256 (256-bit)' },
  { value: 'SHA-384', label: 'SHA-384 (384-bit)' },
  { value: 'SHA-512', label: 'SHA-512 (512-bit)' },
  { value: 'SHA-1', label: 'SHA-1 (160-bit)' },
  { value: 'MD5', label: 'MD5 (128-bit)' },
];

const DEFAULT_DIFFICULTY = 20;
const DIFFICULTY_RE = /^(?:[1-9]\d?|1[01]\d|12[0-8])$/;

/* ---------- component ---------- */

export default function ProofOfWorkTab() {
  const [prefix, setPrefix] = useState('');
  const [hashAlgo, setHashAlgo] = useState('SHA-256');
  const [difficulty, setDifficulty] = useState(String(DEFAULT_DIFFICULTY));
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetail, setProgressDetail] = useState('');
  const [eta, setEta] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setOutputResult: setCtxOutput, setOutputError: setCtxError, setOutputSource, addToHistory } = useAppContext();

  const estimatorRef = useRef<ProgressEstimator | null>(null);
  if (estimatorRef.current === null) estimatorRef.current = new ProgressEstimator();
  const { runAttack, cancelCurrentRun } = useWorkerPool();

  const difficultyValid = DIFFICULTY_RE.test(difficulty);

  const handleStop = useCallback(() => {
    cancelCurrentRun();
    setRunning(false);
    setProgress(0);
    setProgressDetail('');
    setEta(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRun = useCallback(async () => {
    setResult(null);
    setError(null);
    setCtxOutput(null); setCtxError(null);
    setRunning(true);
    setProgress(0);
    setProgressDetail('');
    setEta(null);

    estimatorRef.current!.reset();
    const startTime = performance.now();

    try {
      const workerResult = await runAttack('__pow__', {
        challenge: prefix,
        difficulty,
        hashAlgorithm: hashAlgo,
      }, (pct: number, detail?: string) => {
        setProgress(pct);
        if (detail) setProgressDetail(detail);
        const est = estimatorRef.current!.update(pct);
        setEta(est.formattedEta);
      });

      if (workerResult === null) {
        const elapsed = performance.now() - startTime;
        const errMsg = `No valid nonce found within maximum attempts (${Math.round(elapsed)}ms)`;
        setError(errMsg);
        setCtxError(errMsg);
        setOutputSource('calculator');
        return;
      }

      const parsed = JSON.parse(workerResult) as { nonce: string; hash: string; attempts: number };
      const elapsed = performance.now() - startTime;
      const output = [
        `Algorithm: ${hashAlgo}`,
        `Prefix: "${prefix}"`,
        `Attempts: ${parsed.attempts.toLocaleString()}`,
        `Time: ${Math.round(elapsed)}ms`,
        `Found Nonce: ${parsed.nonce}`,
        `Full Input: "${prefix}${parsed.nonce}"`,
        `Hash: ${parsed.hash}`,
        `METHOD=TYPESCRIPT (Worker)`,
      ].join('\n');

      setResult(output);
      setCtxOutput(output);
      setOutputSource('calculator');
      addToHistory('calculator-hash', 'Proof of Work', output, true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setCtxError(msg);
      setOutputSource('calculator');
    } finally {
      setRunning(false);
      setProgress(0);
      setProgressDetail('');
      setEta(null);
    }
  }, [prefix, difficulty, hashAlgo, runAttack, setCtxOutput, setCtxError, setOutputSource, addToHistory]);


  /* ---- render ---- */
  return (
    <Stack direction="vertical" gap={2}>
      <Text type="supporting">
        {hashAlgo} Proof of Work: find a nonce where {hashAlgo}(challenge + nonce) satisfies your check function.
      </Text>

      {/* Hash Algorithm dropdown */}
      <Selector
        label="Hash Algorithm"
        options={HASH_ALGORITHMS}
        value={hashAlgo}
        onChange={setHashAlgo}
        width="100%"
      />

      {/* Prefix / Challenge */}
      <TextInput
        label="Prefix / Challenge"
        value={prefix}
        onChange={setPrefix}
        placeholder="Text to prefix before nonce (e.g., block_data_)"
        width="100%"
      />

      <TextInput
        label="Difficulty (leading zero bits)"
        description="1–128 bits"
        value={difficulty}
        onChange={setDifficulty}
        width="100%"
        status={difficultyValid ? undefined : { type: 'error', message: 'Enter 1–128 bits' }}
      />

      {/* Run / Stop morphing button */}
      <Button
        label={running ? 'Stop' : 'Run'}
        variant={running ? 'destructive' : 'primary'}
        width="100%"
        onClick={running ? handleStop : () => { void handleRun(); }}
        isDisabled={!difficultyValid}
      />

      {/* Running: progress bar + ETA */}
      {running && (
        <Stack direction="vertical" gap={1} role="status" aria-live="polite" aria-atomic="true">
          <ProgressBar
            label="Searching for nonce"
            value={progress}
            max={100}
            hasValueLabel
            variant="warning"
          />
          {progressDetail && (
            <Text type="supporting" justify="center" style={{ color: 'var(--dracula-orange)' }}>
              {progressDetail}
            </Text>
          )}
          {eta && (
            <Text type="supporting" justify="center" style={{ color: 'var(--dracula-orange)' }}>
              ETA: {eta}
            </Text>
          )}
        </Stack>
      )}

      {/* Idle: no result yet */}
      {!running && !result && !error && (
        <EmptyState
          title="No nonce yet"
          description="Set a prefix and difficulty, then run the search to find a valid nonce."
          isCompact
        />
      )}

      {/* Success result */}
      {result && (
        <ResultBox value={result} label="Nonce found:" />
      )}

      {error && <Banner status="error" title={error} />}
    </Stack>
  );
}
