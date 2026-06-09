import { useState, useRef, useCallback } from 'react';
import { keyframes } from '@mui/material/styles';
import {
  Box, Typography, TextField, Button, IconButton, Tooltip, LinearProgress,
} from '@mui/material';
import { Stop, PlayArrow, HourglassEmpty, ContentCopy } from '@mui/icons-material';
import { draculaColors } from '../../../theme/dracula';
import { inputSx } from '../../../styles/inputSx';
import { outputBoxSx, colorGhostBtn, FONT_FAMILY } from '../../../styles/shared';
import { useWorkerPool } from '../../../hooks/useWorkerPool';
import { ProgressEstimator } from '../../../utils/progressEstimator';

const hourglassSpin = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(180deg); }
  50% { transform: rotate(180deg); }
  75% { transform: rotate(360deg); }
  100% { transform: rotate(360deg); }
`;

/* ---------- component ---------- */

export default function ProofOfWorkTab() {
  const [prefix, setPrefix] = useState('');
  const [difficulty, setDifficulty] = useState('20');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressDetail, setProgressDetail] = useState('');
  const [eta, setEta] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    const diff = parseInt(difficulty, 10);
    if (isNaN(diff) || diff < 1) {
      setError('Difficulty must be at least 1');
      return;
    }

    setResult(null);
    setError(null);
    setRunning(true);
    setProgress(0);
    setProgressDetail('');
    setEta(null);

    estimatorRef.current!.reset();
    const startTime = performance.now();
    const diffParam = String(diff);

    try {
      const workerResult = await runAttack('__pow__', {
        challenge: prefix,
        difficulty: diffParam,
      }, (pct: number, detail?: string) => {
        setProgress(pct);
        if (detail) setProgressDetail(detail);
        const est = estimatorRef.current!.update(pct);
        setEta(est.formattedEta);
      });

      if (workerResult === null) {
        const elapsed = performance.now() - startTime;
        setError(`No valid nonce found within maximum attempts (${Math.round(elapsed)}ms)`);
        return;
      }

      const parsed = JSON.parse(workerResult) as { nonce: string; hash: string; attempts: number };
      const elapsed = performance.now() - startTime;
      const output = [
        `Algorithm: SHA-256`,
        `Condition: Leading Zero Bits (${diff})`,
        `Prefix: "${prefix}"`,
        `Attempts: ${parsed.attempts.toLocaleString()}`,
        `Time: ${Math.round(elapsed)}ms`,
        `Found Nonce: ${parsed.nonce}`,
        `Full Input: "${prefix}${parsed.nonce}"`,
        `Hash: ${parsed.hash}`,
        `METHOD=TYPESCRIPT (Worker)`,
      ].join('\n');

      setResult(output);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRunning(false);
      setProgress(0);
      setProgressDetail('');
      setEta(null);
    }
  }, [prefix, difficulty, runAttack]);

  const handleCopyResult = useCallback(() => {
    if (result) navigator.clipboard.writeText(result).catch(() => {});
  }, [result]);

  /* ---- render ---- */
  return (
    <Box sx={{ pb: '30vh' }}>
      <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="caption" sx={{ color: draculaColors.comment, fontFamily: FONT_FAMILY }}>
          SHA-256 Proof of Work — finds a nonce such that the hash has N leading zero bits.
        </Typography>
      </Box>

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

      {/* Difficulty */}
      <TextField
        fullWidth
        label="Required Zero Bits"
        value={difficulty}
        onChange={e => setDifficulty(e.target.value)}
        variant="outlined"
        type="number"
        slotProps={{ htmlInput: { min: 1, max: 32 } }}
        sx={{ ...inputSx, mb: 2 }}
        placeholder="e.g., 20"
      />

      {/* Run / Stop morphing button */}
      <Button
        fullWidth
        variant="outlined"
        onClick={running ? handleStop : () => { void handleRun(); }}
        sx={{
          ...colorGhostBtn(running ? draculaColors.red : draculaColors.purple),
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
                  fontFamily: FONT_FAMILY,
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
          <Box sx={outputBoxSx}>
            <Box
              sx={{
                fontFamily: FONT_FAMILY,
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
            fontFamily: FONT_FAMILY,
            fontSize: '0.85rem',
          }}
        >
          {error}
        </Typography>
      )}
    </Box>
  );
}
