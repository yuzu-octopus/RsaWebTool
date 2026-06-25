import { useState, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, IconButton, Tooltip, LinearProgress, Collapse, FormControl,
  InputLabel, Select, MenuItem,
} from '@mui/material';
import { Stop, PlayArrow, HourglassEmpty, ContentCopy, ExpandMore, ExpandLess } from '@mui/icons-material';
import { draculaColors } from '../../../theme/dracula';
import { inputSx } from '../../../styles/inputSx';
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

/** Default check function: require first 20 hex chars of hash to be '0' (80 leading bits). */
const DEFAULT_CHECK_CODE = "return hash.startsWith('0'.repeat(20));";

/** Docs examples shown in the collapsible section. */
const DOCS_EXAMPLES = [
  {
    label: 'Leading zeros (hex chars)',
    code: "return hash.startsWith('0'.repeat(20));",
  },
  {
    label: 'Leading zeros (bits)',
    code: [
      "// Convert hex to binary, count leading zeros",
      "const bits = BigInt('0x' + hash).toString(2);",
      "return bits.startsWith('0'.repeat(20));",
    ].join('\n'),
  },
  {
    label: 'Contains substring',
    code: "return hash.includes('deadbeef');",
  },
  {
    label: 'Ends with pattern',
    code: "return hash.endsWith('cafe');",
  },
  {
    label: 'Custom byte sum',
    code: [
      "const bytes = new Uint8Array(hash.match(/.{2}/g).map(b => parseInt(b, 16)));",
      "return ((bytes[0] + bytes[1]) & 0xff) === 0x00;",
    ].join('\n'),
  },
];

/* ---------- component ---------- */

export default function ProofOfWorkTab() {
  const [prefix, setPrefix] = useState('');
  const [hashAlgo, setHashAlgo] = useState('SHA-256');
  const [checkCode, setCheckCode] = useState(DEFAULT_CHECK_CODE);
  const [docsOpen, setDocsOpen] = useState(false);
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
        difficulty: '20',
        checkCode,
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
  }, [prefix, checkCode, hashAlgo, runAttack, setCtxOutput, setCtxError, setOutputSource, addToHistory]);

  const handleCopyResult = useCallback(() => {
    if (result) navigator.clipboard.writeText(result).catch(() => {});
  }, [result]);

  /** Insert an example into the code editor. */
  const insertExample = useCallback((code: string) => {
    setCheckCode(code);
  }, []);

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

      {/* Documentation / Examples — collapsible */}
      <Box sx={{ mb: 2 }}>
        <Box
          onClick={() => setDocsOpen(!docsOpen)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: draculaColors.comment,
            fontFamily: MONO_FAMILY,
            fontSize: '0.8rem',
            userSelect: 'none',
            '&:hover': { color: draculaColors.foreground },
          }}
        >
          {docsOpen ? <ExpandLess sx={{ fontSize: '1rem', mr: 0.5 }} /> : <ExpandMore sx={{ fontSize: '1rem', mr: 0.5 }} />}
          Check function examples
        </Box>
        <Collapse in={docsOpen}>
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              backgroundColor: draculaColors.background,
              border: `1px solid ${draculaColors.currentLine}`,
              borderRadius: '4px',
              fontFamily: MONO_FAMILY,
              fontSize: '0.75rem',
              color: draculaColors.comment,
              whiteSpace: 'pre-wrap',
            }}
          >
            {DOCS_EXAMPLES.map((example, i) => (
              <Box key={i} sx={{ mb: i < DOCS_EXAMPLES.length - 1 ? 1.5 : 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: draculaColors.cyan, fontFamily: MONO_FAMILY, fontSize: '0.7rem' }}
                  >
                    {example.label}
                  </Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => insertExample(example.code)}
                    sx={{
                      minWidth: 0,
                      fontSize: '0.65rem',
                      color: draculaColors.purple,
                      fontFamily: MONO_FAMILY,
                      textTransform: 'none',
                      p: 0,
                      '&:hover': { color: draculaColors.foreground, backgroundColor: 'transparent' },
                    }}
                  >
                    Use
                  </Button>
                </Box>
                <Box
                  sx={{
                    p: 0.75,
                    backgroundColor: draculaColors.currentLine,
                    borderRadius: '2px',
                    color: draculaColors.foreground,
                    fontFamily: MONO_FAMILY,
                    fontSize: '0.72rem',
                    whiteSpace: 'pre-wrap',
                    overflowX: 'auto',
                  }}
                >
                  {example.code}
                </Box>
              </Box>
            ))}
          </Box>
        </Collapse>
      </Box>

      {/* Check function editor */}
      <Typography
        variant="caption"
        sx={{ color: draculaColors.comment, fontFamily: MONO_FAMILY, mb: 0.5, display: 'block' }}
      >
        Check function: receives <Box component="code" sx={{ color: draculaColors.cyan }}>hash</Box> (hex string), returns <Box component="code" sx={{ color: draculaColors.green }}>true</Box> when condition met.
      </Typography>
      <Box
        component="textarea"
        value={checkCode}
        onChange={e => setCheckCode(e.target.value)}
        spellCheck={false}
        sx={{
          width: '100%',
          height: 120,
          resize: 'vertical',
          fontFamily: MONO_FAMILY,
          fontSize: '0.8rem',
          backgroundColor: '#282a36',
          color: '#f8f8f2',
          border: '1px solid #44475a',
          borderRadius: '4px',
          p: 1,
          outline: 'none',
          '&:focus': {
            borderColor: draculaColors.purple,
          },
          '&::placeholder': {
            color: draculaColors.comment,
          },
        }}
        placeholder="return hash.startsWith('0'.repeat(20));"
      />

      {/* Run / Stop morphing button */}
      <Button
        fullWidth
        variant="outlined"
        onClick={running ? handleStop : () => { void handleRun(); }}
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
