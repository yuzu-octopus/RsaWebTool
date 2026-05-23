import { useState, useRef, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import { AutoFixHigh, Science, CheckCircle, Cancel, HourglassEmpty, SkipNext, Stop, ExpandMore, ExpandLess, Casino } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { useSageMathParallel } from '../hooks/useSageMath';
import { attacks, attacksByCategory } from '../attacks';
import { detectFormat, parsePEM } from '../utils/converters';
import { generateKeyPair, encrypt, TESTCASE_BITS } from '../utils/testcases/core';
import { isActualSuccess } from '../utils/sage-output';
import { reportFactor, extractPQ } from '../utils/factordb';
import { inputSx } from '../styles/inputSx';
import type { Attack } from '../types';

// Categorized parameter names for key=value extraction
const kvParamNames = [
  // Core RSA parameters
  'n', 'e', 'c', 'd', 'p', 'q', 'dp', 'dq', 'qinv',
  // Lattice / partial key
  'dLow', 'nearp', 'bound', 'B2', 'B', 'a', 'b', 'e1', 'e2', 'c1', 'c2',
  // Broadcast / related messages
  'ciphertexts', 'hash_hex', 'target_m', 'sig_valid', 'sig_faulty', 'k_phi',
  // Advanced / Coppersmith
  'base', 'bitOffset', 'bitLength', 'num_primes', 'knownBits', 'bitPosition',
  // Oracle / protocol
  'oracle_responses', 'oracle_runs', 'phi', 'moduli_list', 'n_values',
  'pairs', 'triples', 'oracle_pairs', 'known_prefix', 'p_msb', 'leak', 'unknown_bits',
];
const kvRegex = new RegExp(`(?<name>${kvParamNames.join('|')})\\s*=\\s*(?<value>[0-9a-fA-F,\\n]+)`, 'g');

function extractParams(input: string): Record<string, string> {
  const params: Record<string, string> = {};
  let match;
  while ((match = kvRegex.exec(input)) !== null) {
    if (match.groups?.name && match.groups?.value) {
      params[match.groups.name] = match.groups.value.trim();
    }
  }
  const detectedFmt = detectFormat(input.trim());
  if (detectedFmt === 'hex' && !params.n) {
    params.n = input.trim().replace(/^0x/, '').replace(/\s/g, '');
  } else if (detectedFmt === 'decimal' && !params.n) {
    params.n = input.trim();
  }
  const pemResult = parsePEM(input);
  if (pemResult) {
    params.n = pemResult.n;
    if (!params.e) params.e = pemResult.e;
  }
  return params;
}

// Status icon render function extracted outside component
function statusIcon(status: MagicJob['status']) {
  if (status === 'success') return <CheckCircle sx={{ color: draculaColors.green, fontSize: '1rem', mr: 0.5 }} />;
  if (status === 'error') return <Cancel sx={{ color: draculaColors.red, fontSize: '1rem', mr: 0.5 }} />;
  if (status === 'cancelled') return <Stop sx={{ color: draculaColors.orange, fontSize: '1rem', mr: 0.5 }} />;
  if (status === 'aborted') return <SkipNext sx={{ color: draculaColors.comment, fontSize: '1rem', mr: 0.5 }} />;
  return <HourglassEmpty sx={{ color: draculaColors.orange, fontSize: '1rem', mr: 0.5 }} />;
}

interface MagicJob {
  attackId: string;
  attackName: string;
  status: 'running' | 'success' | 'error' | 'aborted' | 'cancelled';
  result?: string;
  error?: string;
}

export function MagicPanel() {
  const { viewMode, setOutputResult, setOutputError, addToHistory, showNotification } = useAppContext();
  const { executeAll, createController } = useSageMathParallel();
  const [rawInput, setRawInput] = useState('');
  const [jobs, setJobs] = useState<MagicJob[]>([]);
  const [running, setRunning] = useState(false);
  const [earlyStop, setEarlyStop] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const [showApplicable, setShowApplicable] = useState(false);
  const [testcaseMsg, setTestcaseMsg] = useState<string | null>(null);

  const applicablePreview = useMemo(() => {
    if (!rawInput.trim()) return [];
    const params = extractParams(rawInput);
    return attacks.filter(a => {
      try { return a.applicableCheck(params); } catch { return false; }
    });
  }, [rawInput]);

  const handleCrack = async () => {
    abortControllerRef.current?.abort();
    const currentRunId = ++runIdRef.current;
    const controller = createController();
    abortControllerRef.current = controller;
    setRunning(true);
    setJobs([]);
    setEarlyStop(false);
    setOutputResult(null);
    setOutputError(null);

    const params = extractParams(rawInput);

    const applicable = applicablePreview;

    const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const sorted = [...applicable].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const initialJobs: MagicJob[] = sorted.map(a => ({
      attackId: a.id,
      attackName: a.name,
      status: 'running',
    }));
    setJobs(initialJobs);

    const preCheckResults = await Promise.all(
      sorted.map(async (a, i) => {
        if (a.frontendCheck) {
          try {
            const result = await a.frontendCheck(params);
            if (result !== null) {
              return { index: i, result };
            }
          } catch (e) {
            return { index: i, error: e instanceof Error ? e.message : 'Unknown frontendCheck error' };
          }
        }
        return null;
      }),
    );

    const remaining: { attack: Attack; originalIndex: number }[] = [];

    for (let i = 0; i < sorted.length; i++) {
      if (!preCheckResults[i]) {
        remaining.push({ attack: sorted[i], originalIndex: i });
      }
    }

    const codes = remaining.map(r => r.attack.sageTemplate(params));

    try {
      const results = await executeAll(codes, 3, 35000, (_index, result) => {
        if (currentRunId !== runIdRef.current) return true;
        if (result.success && isActualSuccess(result.stdout)) {
          setEarlyStop(true);
          return true;
        }
        return false;
      }, controller);

      if (currentRunId !== runIdRef.current) return;
      const updatedJobs = initialJobs.map((job, i) => {
        const pre = preCheckResults[i];
        if (pre) {
          if ('error' in pre) {
            return { ...job, status: 'error' as const, error: pre.error };
          }
          const isSuccess = isActualSuccess(pre.result);
          return { ...job, status: (isSuccess ? 'success' : 'error') as MagicJob['status'], result: pre.result };
        }
        const ri = remaining.findIndex(r => r.originalIndex === i);
        if (ri >= 0 && ri < results.length) {
          const r = results[ri];
          const jobStatus: MagicJob['status'] =
            r.success && isActualSuccess(r.stdout) ? 'success' : r.error === 'Aborted' ? 'aborted' : r.error === 'Cancelled' ? 'cancelled' : 'error';
          return {
            ...job,
            status: jobStatus,
            result: r.stdout,
            error: r.error,
          };
        }
        // Job wasn't reached (early stop)
        return { ...job, status: 'aborted' as const };
      });
      setJobs(updatedJobs);

      if (currentRunId !== runIdRef.current) return;
      const firstSuccess = updatedJobs.find(j => j.status === 'success');
      if (firstSuccess) {
        setOutputResult(firstSuccess.result || '');
        addToHistory(firstSuccess.attackId, firstSuccess.attackName, firstSuccess.result || '', true);
        showNotification(`${firstSuccess.attackName}: success`, 'success');
        const attack = attacks.find(a => a.id === firstSuccess.attackId);
        if (attack && attacksByCategory.get('Factorization')?.includes(attack)) {
          const pq = extractPQ(firstSuccess.result || '');
          if (pq && params.n) {
            reportFactor(params.n, [pq.p, pq.q]).then(
              resp => showNotification(resp === 'Already fully factored' ? 'Already known to FactorDB' : 'Submitted to FactorDB', 'info'),
              err => { console.error('FactorDB submission failed:', err); showNotification('Failed to submit to FactorDB', 'error'); },
            );
          }
        }
      }
    } catch (err: unknown) {
      if (currentRunId !== runIdRef.current) return;
      const message = err instanceof Error ? err.message : 'Magic cracker failed';
      setOutputError(message);
    } finally {
      if (currentRunId === runIdRef.current) {
        setRunning(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleGenerateTestcase = useCallback(() => {
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
    setTimeout(() => setTestcaseMsg(null), 3000);
  }, []);

  if (viewMode !== 'magic') return null;

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h2" sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoFixHigh sx={{ fontSize: 'inherit' }} /> Magic Cracker
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 3 }}>
            Paste everything you have — we'll figure out which attacks to try
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={8}
            label="Raw input (PEM, hex, decimal, key=value pairs...)"
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            variant="outlined"
            sx={inputSx}
          />

          {/* Applicable preview */}
          {rawInput.trim() && !running && (
            <Box sx={{ mt: 1 }}>
              <Button
                fullWidth
                onClick={() => setShowApplicable(!showApplicable)}
                sx={{
                  color: draculaColors.comment,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.75rem',
                  justifyContent: 'space-between',
                  px: 1,
                  py: 0.5,
                  '&:hover': { backgroundColor: draculaColors.background },
                }}
                endIcon={showApplicable ? <ExpandLess sx={{ fontSize: '1rem' }} /> : <ExpandMore sx={{ fontSize: '1rem' }} />}
              >
                {applicablePreview.length} attacks applicable
              </Button>
              <Collapse in={showApplicable}>
                <Box sx={{ px: 2, py: 1 }}>
                  {applicablePreview.map(a => (
                    <Typography key={a.id} sx={{ color: draculaColors.foreground, fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", py: 0.25 }}>
                      {a.name} <Typography component="span" sx={{ color: draculaColors.comment }}>({a.priority})</Typography>
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}

          {/* Generate Testcase button */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGenerateTestcase}
              sx={{
                borderColor: draculaColors.cyan,
                color: draculaColors.cyan,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8rem',
                '&:hover': { backgroundColor: draculaColors.cyan, color: draculaColors.background },
              }}
              startIcon={<Casino sx={{ fontSize: '1rem' }} />}
            >
              Generate Testcase
            </Button>
          </Box>

          {testcaseMsg && (
            <Typography variant="body2" sx={{ color: draculaColors.orange, mt: 1, textAlign: 'center', fontSize: '0.75rem' }}>
              {testcaseMsg}
            </Typography>
          )}

          {/* Run / Stop button */}
          {running ? (
            <Button
              fullWidth
              variant="outlined"
              onClick={handleStop}
              sx={{
                mt: 2,
                borderColor: draculaColors.red,
                color: draculaColors.red,
                fontFamily: "'JetBrains Mono', monospace",
                '&:hover': { backgroundColor: draculaColors.red, color: draculaColors.background },
              }}
            >
              <Stop sx={{ mr: 1 }} /> Stop
            </Button>
          ) : (
            <Button
              fullWidth
              variant="outlined"
              onClick={() => { void handleCrack(); }}
              disabled={!rawInput.trim()}
              sx={{
                mt: 2,
                borderColor: draculaColors.purple,
                color: draculaColors.purple,
                fontFamily: "'JetBrains Mono', monospace",
                '&:hover': { backgroundColor: draculaColors.purple, color: draculaColors.background },
                '&:disabled': { borderColor: draculaColors.comment, color: draculaColors.comment },
              }}
            >
              <Science sx={{ mr: 1 }} /> Crack It
            </Button>
          )}

          {/* Progress bar and status */}
          {running && (
            <Box sx={{ mt: 2, width: '100%' }}>
              <LinearProgress
                variant="determinate"
                value={jobs.length > 0 ? (jobs.filter(j => j.status !== 'running').length / jobs.length) * 100 : 0}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: draculaColors.currentLine,
                  '& .MuiLinearProgress-bar': { backgroundColor: draculaColors.purple },
                }}
              />
              <Typography variant="body2" sx={{ color: draculaColors.purple, mt: 1, textAlign: 'center', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: draculaColors.purple }} />
                {jobs.filter(j => j.status !== 'running').length}/{jobs.length} completed
                {jobs.filter(j => j.status === 'running').length > 0 && `, ${jobs.filter(j => j.status === 'running').length} running`}
              </Typography>
            </Box>
          )}

          {earlyStop && (
            <Typography variant="body2" sx={{ color: draculaColors.green, mt: 1, textAlign: 'center' }}>
              Found result — stopping early
            </Typography>
          )}

          {/* Results summary */}
          {!running && jobs.length > 0 && (
            <Typography variant="body2" sx={{ color: draculaColors.comment, mt: 1, textAlign: 'center', fontSize: '0.75rem' }}>
              <Typography component="span" sx={{ color: draculaColors.green }}>{jobs.filter(j => j.status === 'success').length} succeeded</Typography>
              {', '}
              <Typography component="span" sx={{ color: draculaColors.red }}>{jobs.filter(j => j.status === 'error').length} failed</Typography>
              {jobs.filter(j => j.status === 'aborted').length > 0 && (
                <>, <Typography component="span" sx={{ color: draculaColors.comment }}>{jobs.filter(j => j.status === 'aborted').length} skipped</Typography></>
              )}
              {jobs.filter(j => j.status === 'cancelled').length > 0 && (
                <>, <Typography component="span" sx={{ color: draculaColors.orange }}>{jobs.filter(j => j.status === 'cancelled').length} cancelled</Typography></>
              )}
            </Typography>
          )}

          {jobs.length > 0 && (
            <>
              <Divider sx={{ borderColor: draculaColors.comment, my: 2 }} />
              <List dense>
                {jobs.map(job => (
                  <ListItem key={job.attackId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography sx={{
                          display: 'flex',
                          alignItems: 'center',
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.8rem',
                          color: job.status === 'success' ? draculaColors.green : job.status === 'error' ? draculaColors.red : job.status === 'cancelled' ? draculaColors.orange : draculaColors.orange,
                        }}>
                          {statusIcon(job.status)} {job.attackName}
                        </Typography>
                      }
                      secondary={job.error && (
                        <Typography sx={{ color: draculaColors.comment, fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace" }}>
                          {job.error}
                        </Typography>
                      )}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
