import { draculaColors } from '../../../theme/dracula';
import { useState, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, IconButton, Tooltip, LinearProgress, FormControl,
  InputLabel, Select, MenuItem,
} from '@mui/material';
import { Stop, PlayArrow, HourglassEmpty, ContentCopy } from '@mui/icons-material';
import { inputSx } from '../../../styles/shared';
import { outputBoxSx, colorGhostBtn, hourglassSpin, MONO_FAMILY } from '../../../styles/shared';
import { useWorkerPool } from '../../../hooks/useWorkerPool';
import { ProgressEstimator } from '../../../utils/progressEstimator';
import { useAppContext } from '../../../hooks/useAppContext';

const HASH_ALGORITHMS = [
  { value: 'SHA-256', label: 'SHA-256 (256-bit)' },
  { value: 'SHA-384', label: 'SHA-384 (384-bit)' },
  { value: 'SHA-512', label: 'SHA-512 (512-bit)' },
  { value: 'SHA-1', label: 'SHA-1 (160-bit)' },
  { value: 'MD5', label: 'MD5 (128-bit)' },
];

const DEFAULT_DIFFICULTY = 20;

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

  const handleCopyResult = useCallback(() => {
    if (result) navigator.clipboard.writeText(result).catch(() => {});
  }, [result]);


  /* ---- render ---- */
  return (
    <Box>
      <Typography variant="caption" sx={{ color: draculaColors.comment, fontFamily: MONO_FAMILY, mb: 1, display: 'block' }}>
        {hashAlgo} Proof of Work — find a nonce where {hashAlgo}(challenge + nonce) satisfies your check function.
      </Typography>

      {/* Hash Algorithm dropdown */}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: draculaColors.comment, fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>
          Hash Algorithm
        </InputLabel>
        <Select
          value={hashAlgo}
          label="Hash Algorithm"
          onChange={e => setHashAlgo(e.target.value)}
          sx={{
            fontFamily: MONO_FAMILY,
            fontSize: '0.85rem',
            color: draculaColors.foreground,
            backgroundColor: draculaColors.background,
            border: `1px solid ${draculaColors.currentLine}`,
            borderRadius: '4px',
            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            '&:hover': { borderColor: draculaColors.purple },
            '&.Mui-focused': { borderColor: draculaColors.purple },
          }}
        >
          {HASH_ALGORITHMS.map(algo => (
            <MenuItem key={algo.value} value={algo.value} sx={{ fontFamily: MONO_FAMILY, fontSize: '0.85rem' }}>
              {algo.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Prefix / Challenge */}
      <TextField
        fullWidth
        label="Prefix / Challenge"
        value={prefix}
        onChange={e => setPrefix(e.target.value)}
        variant="outlined"
        sx={{ ...inputSx, mb: 2 }}
        placeholder="Text to prefix before nonce (e.g., block_data_)"
      />

      <TextField
        fullWidth
        label="Difficulty (leading zero bits)"
        value={difficulty}
        onChange={e => setDifficulty(e.target.value)}
        slotProps={{ htmlInput: { inputMode: 'numeric', min: 1, max: 128 } }}
        error={!/^(?:[1-9]\d?|1[01]\d|12[0-8])$/.test(difficulty)}
        helperText="1–128 bits"
        sx={{ ...inputSx, mb: 2 }}
      />

      {/* Run / Stop morphing button */}
      <Button
        fullWidth
        variant="outlined"
        onClick={running ? handleStop : () => { void handleRun(); }}
        disabled={!/^(?:[1-9]\d?|1[01]\d|12[0-8])$/.test(difficulty)}
        sx={{
          ...colorGhostBtn(running ? draculaColors.red : draculaColors.purple),
          mt: 2,
          mb: 2,
        }}
        startIcon={running ? <Stop /> : <PlayArrow />}
      >
        {running ? 'Stop' : 'Run'}
      </Button>

      {/* Running: hourglass + progress bar + ETA */}
      {running && (
        <>
          <Typography
            variant="body2"
            sx={{
              color: draculaColors.orange,
              mb: 1,
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <HourglassEmpty
              sx={{
                color: draculaColors.orange,
                fontSize: '1rem',
                animation: `${hourglassSpin} 3s ease-in-out infinite`,
              }}
            />
            Searching&hellip;
          </Typography>

          {progress > 0 && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: draculaColors.currentLine,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: draculaColors.orange,
                    borderRadius: 3,
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: draculaColors.orange,
                  mt: 0.5,
                  textAlign: 'center',
                  display: 'block',
                  fontFamily: MONO_FAMILY,
                }}
              >
                {progressDetail}
              </Typography>
              {eta && (
                <Typography
                  variant="caption"
                  sx={{
                    color: draculaColors.comment,
                    mt: 0.5,
                    textAlign: 'center',
                    display: 'block',
                  }}
                >
                  ETA: {eta}
                </Typography>
              )}
            </Box>
          )}
        </>
      )}

      {/* Success result */}
      {result && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: draculaColors.green }}>
              Nonce found:
            </Typography>
            <Tooltip title="Copy result">
              <IconButton
                size="small"
                onClick={handleCopyResult}
                sx={{ color: draculaColors.cyan }}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={outputBoxSx()}>
            <Box
              sx={{
                fontFamily: MONO_FAMILY,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {result}
            </Box>
          </Box>
        </Box>
      )}

      {/* Error output */}
      {error && (
        <Typography
          sx={{
            color: draculaColors.red,
            mt: 2,
            fontFamily: MONO_FAMILY,
            fontSize: '0.85rem',
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}
