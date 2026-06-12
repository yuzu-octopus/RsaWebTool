import { useState, useEffect, useMemo, memo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
  Collapse,
  LinearProgress,
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import { AutoFixHigh, Science, CheckCircle, Cancel, HourglassEmpty, SkipNext, Stop, ExpandMore, ExpandLess, Casino, ContentCopy } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { useMagicExecution } from '../hooks/useMagicExecution';
import { attacks } from '../attacks';
import { detectFormat, parsePEM } from '../utils/converters';
import { inputSx } from '../styles/inputSx';
import { colFlexSx, centeredPanelSx, colorGhostBtn, MONO_FAMILY } from '../styles/shared';
import type { Attack } from '../types';

const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };

const hourglassSpin = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(180deg); }
  50% { transform: rotate(180deg); }
  75% { transform: rotate(360deg); }
  100% { transform: rotate(360deg); }
`;

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
const kvRegex = new RegExp(`(?<name>${kvParamNames.join('|')})\\s*=\\s*(?<value>[0-9a-fA-FxX,\\n]+)`, 'g');

// Common JSON key aliases for structured input
const KEY_ALIASES: Record<string, string> = {
  ct: 'c', ciphertext: 'c', cipher: 'c', cipher_text: 'c',
  modulus: 'n', mod: 'n', exponent: 'e', exp: 'e',
  plaintext: 'm', plain: 'm', message: 'm', msg: 'm',
};

function extractParams(input: string): Record<string, string> {
  const trimmed = input.trim();
  const params: Record<string, string> = {};
  let match;
  while ((match = kvRegex.exec(input)) !== null) {
    if (match.groups?.name && match.groups?.value) {
      params[match.groups.name] = match.groups.value.replace(/\s/g, '');
    }
  }
  // JSON structured input support ({ "n": "0x...", "e": "65537", "ct": "..." })
  try {
    const json = JSON.parse(trimmed) as Record<string, unknown>;
    if (typeof json === 'object' && !Array.isArray(json) && json !== null) {
      for (const [key, value] of Object.entries(json)) {
        const mapped = KEY_ALIASES[key.toLowerCase()] || key;
        if (typeof value === 'string' && !params[mapped]) {
          params[mapped] = value.replace(/\s/g, '');
        } else if (typeof value === 'number' && !params[mapped]) {
          params[mapped] = value.toString();
        }
      }
    }
  } catch { /* not JSON */ }
  const detectedFmt = detectFormat(trimmed);
  if (detectedFmt === 'hex' && !params.n) {
    let hex = trimmed.replace(/\s/g, '');
    if (!/^0x/i.test(hex)) hex = '0x' + hex;
    params.n = hex;
  } else if (detectedFmt === 'decimal' && !params.n) {
    params.n = trimmed;
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
  return <HourglassEmpty sx={{ color: draculaColors.orange, fontSize: '1rem', mr: 0.5, animation: `${hourglassSpin} 3s ease-in-out infinite` }} />;
}


interface MagicJob {
  attackId: string;
  attackName: string;
  status: 'running' | 'success' | 'error' | 'aborted' | 'cancelled';
  result?: string;
  error?: string;
}

// --- Extracted memoized components ---

const JobListItem = memo(function JobListItem({
  job,
  expanded,
  onToggle,
  attackId,
}: {
  job: MagicJob;
  expanded: boolean;
  onToggle: (id: string) => void;
  attackId: string;
}) {
  const primaryContent = useMemo(() => (
    <Typography sx={{
      display: 'flex',
      alignItems: 'center',
      fontFamily: MONO_FAMILY,
      fontSize: '0.8rem',
      color: job.status === 'success' ? draculaColors.green : job.status === 'error' ? draculaColors.red : job.status === 'cancelled' ? draculaColors.orange : draculaColors.orange,
    }}>
      {statusIcon(job.status)} {job.attackName}
    </Typography>
  ), [job.status, job.attackName]);

  const secondaryContent = useMemo(() =>
    job.error && !expanded ? (
      <Typography sx={{ color: draculaColors.comment, fontSize: '0.7rem', fontFamily: MONO_FAMILY }}>
        {job.error.length > 80 ? `${job.error.slice(0, 77)}...` : job.error}
      </Typography>
    ) : null,
    [job.error, expanded]
  );

  return (
    <ListItem sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch' }}>
      <Box
        onClick={() => onToggle(attackId)}
        sx={{ display: 'flex', alignItems: 'center', cursor: (job.result || job.error) ? 'pointer' : 'default', width: '100%' }}
      >
        <ListItemText
          primary={primaryContent}
          secondary={secondaryContent}
        />
        {(job.result || job.error) && (
          <Typography sx={{ color: draculaColors.comment, display: 'flex', alignItems: 'center', mr: 1 }}>
            {expanded ? <ExpandLess sx={{ fontSize: '1rem' }} /> : <ExpandMore sx={{ fontSize: '1rem' }} />}
          </Typography>
        )}
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ ml: 2, mt: 0.5, p: 1, borderRadius: 1, backgroundColor: draculaColors.background, maxHeight: 200, overflow: 'auto', position: 'relative' }}>
          {(job.result || job.error) && (
            <IconButton
              size="small"
              onClick={() => { void navigator.clipboard.writeText(job.result || job.error || ''); }}
              sx={{ position: 'absolute', top: 2, right: 2, color: draculaColors.comment, zIndex: 1 }}
            >
              <ContentCopy sx={{ fontSize: '0.8rem' }} />
            </IconButton>
          )}
          <Typography sx={{ color: draculaColors.foreground, fontSize: '0.7rem', fontFamily: MONO_FAMILY, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {job.result || job.error || ''}
          </Typography>
        </Box>
      </Collapse>
    </ListItem>
  );
});

const ExtractedParams = memo(function ExtractedParams({ params }: { params: Record<string, string> }) {
  return (
    <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, backgroundColor: draculaColors.currentLine, border: `1px solid ${draculaColors.comment}` }}>
      <Typography sx={{ color: draculaColors.comment, fontSize: '0.7rem', fontFamily: MONO_FAMILY, mb: 0.75 }}>
        Extracted parameters
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {Object.entries(params).map(([key, value]) => (
          <Box key={key} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25, backgroundColor: draculaColors.background, borderRadius: 0.5, px: 0.75, py: 0.25 }}>
            <Typography sx={{ color: draculaColors.purple, fontSize: '0.7rem', fontFamily: MONO_FAMILY }}>{key}</Typography>
            <Typography sx={{ color: draculaColors.foreground, fontSize: '0.7rem', fontFamily: MONO_FAMILY }}>=</Typography>
            <Typography sx={{ color: value.length > 50 ? draculaColors.orange : draculaColors.foreground, fontSize: '0.7rem', fontFamily: MONO_FAMILY, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value.length > 50 ? `${value.slice(0, 47)}...` : value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
});

const ApplicableList = memo(function ApplicableList({ byCategory }: { byCategory: Record<string, Attack[]> }) {
  return (
    <>
      {Object.entries(byCategory).map(([cat, catAttacks]) => (
        <Box key={cat} sx={{ mb: 1 }}>
          <Typography sx={{ color: draculaColors.cyan, fontSize: '0.65rem', fontFamily: MONO_FAMILY, mb: 0.5 }}>
            {cat}
          </Typography>
          {catAttacks.map(a => (
            <Typography key={a.id} sx={{ color: draculaColors.foreground, fontSize: '0.7rem', fontFamily: MONO_FAMILY, py: 0.25 }}>
              {a.name} <Typography component="span" sx={{ color: draculaColors.comment }}>({a.priority})</Typography>
            </Typography>
          ))}
        </Box>
      ))}
    </>
  );
});

const ErrorInsightBox = memo(function ErrorInsightBox({ insights }: { insights: string }) {
  return (
    <Box sx={{ mt: 1.5, p: 1, borderRadius: 1, backgroundColor: draculaColors.currentLine, border: `1px solid ${draculaColors.comment}` }}>
      <Typography sx={{ color: draculaColors.orange, fontSize: '0.7rem', fontFamily: MONO_FAMILY }}>
        No attack succeeded: {insights}
      </Typography>
      <Typography sx={{ color: draculaColors.comment, fontSize: '0.65rem', fontFamily: MONO_FAMILY, mt: 0.5 }}>
        Try checking parameter names, using a PEM key, or selecting a specific attack from the sidebar
      </Typography>
    </Box>
  );
});


export function MagicPanel() {
  const { viewMode } = useAppContext();
  const [rawInput, setRawInput] = useState('');
  const [showApplicable, setShowApplicable] = useState(false);

  // Compute raw params once, share between applicablePreview and extractedParams
  const paramsFromInput = useMemo(() => {
    if (!rawInput.trim()) return null;
    return extractParams(rawInput);
  }, [rawInput]);

  const applicablePreview = useMemo(() => {
    if (!paramsFromInput) return [];
    return attacks.filter(a => {
      if (a.category === 'Oracle') return false;
      try { return a.applicableCheck(paramsFromInput); } catch { return false; }
    });
  }, [paramsFromInput]);

  const sortedApplicable = useMemo(() =>
    applicablePreview.toSorted((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
    [applicablePreview],
  );

  const extractedParams = useMemo(() => {
    if (!paramsFromInput) return null;
    return Object.keys(paramsFromInput).length > 0 ? paramsFromInput : null;
  }, [paramsFromInput]);

  const applicableByCategory = useMemo(() => {
    const grouped: Record<string, typeof applicablePreview> = {};
    for (const a of applicablePreview) {
      const cat = a.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(a);
    }
    return grouped;
  }, [applicablePreview]);

  const {
    running, earlyStop, errorInsights,
    jobs,
    displayedPct,
    testcaseMsg,
    expandedJob, handleToggleJob,
    timer,
    handleCrack, handleStop, handleGenerateTestcase,
  } = useMagicExecution(sortedApplicable, paramsFromInput, setRawInput);

  // NOTE: This listener must stay registered even when MagicPanel is hidden
  // (it is placed before the viewMode early-return below). It depends on
  // MagicPanel being always-mounted in App.tsx — if you ever switch to
  // conditional panel mounting, move the prefill payload into AppContext
  // instead, otherwise events dispatched before mount will be lost.
  useEffect(() => {
    const handler = (event: Event) => {
      const { n, e } = (event as CustomEvent<{ n: string; e?: string }>).detail ?? {};
      if (!n) return;
      const lines = [`n = ${n}`];
      if (e) lines.push(`e = ${e}`);
      setRawInput(lines.join('\n'));
    };
    window.addEventListener('magic-prefill', handler);
    return () => window.removeEventListener('magic-prefill', handler);
  }, []);

  if (viewMode !== 'magic') return null;

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h3" sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoFixHigh sx={{ fontSize: 'inherit' }} /> Magic Cracker
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 3 }}>
            Paste everything you have: we'll figure out which attacks to try
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

          {/* Empty state — show format examples */}
          {!rawInput.trim() && !running && jobs.length === 0 && (
            <Box sx={{ mt: 2, p: 2, borderRadius: 1, backgroundColor: draculaColors.currentLine, border: `1px solid ${draculaColors.comment}` }}>
              <Typography sx={{ color: draculaColors.comment, fontSize: '0.7rem', fontFamily: MONO_FAMILY, mb: 1 }}>
                Paste any of these formats:
              </Typography>
              <Box sx={{ fontFamily: MONO_FAMILY, fontSize: '0.7rem', color: draculaColors.foreground, '& div': { mb: 0.5 } }}>
                <div>n = <span style={{ color: draculaColors.cyan }}>1234567890abcdef…</span></div>
                <div>e = <span style={{ color: draculaColors.cyan }}>65537</span></div>
                <div style={{ color: draculaColors.comment }}>/ or PEM public key /</div>
                <div style={{ color: draculaColors.comment }}>-----BEGIN RSA PUBLIC KEY-----</div>
                <div style={{ color: draculaColors.comment }}>/ or just hex/decimal n /</div>
                <div style={{ color: draculaColors.comment }}>00c3a7...</div>
                <div style={{ color: draculaColors.comment }}>/ or JSON /</div>
                <div style={{ color: draculaColors.cyan }}>{`{"n": "0x...", "e": 65537, "ct": "..."}`}</div>
              </Box>
            </Box>
          )}

          {/* Extracted params preview */}
          {extractedParams && !running && (
            <ExtractedParams params={extractedParams} />
          )}

          {/* Applicable preview */}
          {rawInput.trim() && !running && (
            <Box sx={{ mt: 1 }}>
              <Button
                fullWidth
                onClick={() => setShowApplicable(!showApplicable)}
                sx={{
                  color: draculaColors.comment,
                  fontFamily: MONO_FAMILY,
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
                <ApplicableList byCategory={applicableByCategory} />
              </Collapse>
            </Box>
          )}

          {/* Generate Testcase + Run/Stop buttons */}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGenerateTestcase}
              sx={colorGhostBtn(draculaColors.cyan)}
              startIcon={<Casino sx={{ fontSize: '1rem' }} />}
            >
              Generate Testcase
            </Button>

            {running ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={handleStop}
                sx={colorGhostBtn(draculaColors.red)}
              >
                <Stop sx={{ mr: 1 }} /> Stop
              </Button>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => { void handleCrack(); }}
                disabled={!rawInput.trim()}
                sx={{ ...colorGhostBtn(draculaColors.purple), '&:disabled': { borderColor: draculaColors.comment, color: draculaColors.comment } }}
              >
                <Science sx={{ mr: 1 }} /> Crack It
              </Button>
            )}
          </Box>

          {testcaseMsg && (
            <Typography variant="body2" sx={{ color: draculaColors.orange, mt: 1, textAlign: 'center', fontSize: '0.75rem' }}>
              {testcaseMsg}
            </Typography>
          )}

          {/* Progress bar and status */}
          {running && (
            <Box sx={{ mt: 2, width: '100%' }}>
              <LinearProgress
                variant="determinate"
                value={displayedPct}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: draculaColors.currentLine,
                  '& .MuiLinearProgress-bar': { backgroundColor: draculaColors.purple },
                }}
              />
              <Typography variant="body2" sx={{ color: draculaColors.purple, mt: 1, textAlign: 'center', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <HourglassEmpty sx={{ fontSize: '1rem', animation: `${hourglassSpin} 3s ease-in-out infinite` }} />
                Elapsed: {timer.formatted} / {jobs.filter(j => j.status !== 'running').length}/{jobs.length} completed
              </Typography>
            </Box>
          )}

          {earlyStop && (
            <Typography variant="body2" sx={{ color: draculaColors.green, mt: 1, textAlign: 'center' }}>
              Found result: stopping early
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

          {/* Error insights */}
          {errorInsights && !running && (
            <ErrorInsightBox insights={errorInsights} />
          )}

          {jobs.length > 0 && (
            <>
              <Divider sx={{ borderColor: draculaColors.comment, my: 2 }} />
              <List dense>
                {jobs.map(job => (
                  <JobListItem
                    key={job.attackId}
                    job={job}
                    expanded={expandedJob === job.attackId}
                    onToggle={handleToggleJob}
                    attackId={job.attackId}
                  />
                ))}
              </List>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
