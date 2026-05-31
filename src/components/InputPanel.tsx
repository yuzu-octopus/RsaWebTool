import { useState, useReducer, useRef, useEffect } from 'react';
import { keyframes } from '@mui/material/styles';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  LinearProgress,
  Divider,
} from '@mui/material';
import { Stop, Casino, ContentCopy, HourglassEmpty } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { useSageMath, DEFAULT_SAGE_TIMEOUT } from '../hooks/useSageMath';
import { useWorkerPool } from '../hooks/useWorkerPool';
import { ProofRenderer } from './ProofRenderer';
import { testcaseGenerators, submitToFactorDB, autoDecrypt } from '../attacks';
import { isActualSuccess } from '../utils/sageOutput';
import { inputSx } from '../styles/inputSx';
import { colFlexSx, centeredPanelSx, tabSx, colorGhostBtn, ghostBtnSx, draculaSourceTheme, FONT_FAMILY } from '../styles/shared';
import { useTimer } from '../hooks/useTimer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { getAttackSource, extractFrontendCheck, dedent } from '../attacks/rawSources';
import { ProgressEstimator } from '../utils/progressEstimator';

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

const hourglassSpin = keyframes`
  0% { transform: rotate(0deg); }
  25% { transform: rotate(180deg); }
  50% { transform: rotate(180deg); }
  75% { transform: rotate(360deg); }
  100% { transform: rotate(360deg); }
`;

export function InputPanel() {
  const { selectedAttack, viewMode, setOutputResult, setOutputError, setOutputSource, addToHistory, showNotification } = useAppContext();
  const { execute } = useSageMath();
  const [tab, setTab] = useState(0);
  const [sourceMode, setSourceMode] = useState<'sage' | 'frontend'>('sage');
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [progressState, dispatchProgress] = useReducer(progressReducer, initialProgress);
  const loading = progressState.loading;
  const progress = progressState.pct;
  const progressDetail = progressState.detail;
  const abortControllerRef = useRef<AbortController | null>(null);
  const attackIdRef = useRef<string | null>(null);
  const [testcaseMsg, setTestcaseMsg] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const estimatorRef = useRef(new ProgressEstimator());
  const lastEtaUpdate = useRef(0);
  const ownershipRef = useRef<'input' | 'magic' | null>(null);
  const timer = useTimer();
  const [frontendCode, setFrontendCode] = useState('');
  const [eta, setEta] = useState<string | null>(null);
  const { runAttack, cancelCurrentRun } = useWorkerPool();
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const id of timeoutIdsRef.current) clearTimeout(id);
      timeoutIdsRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (viewMode !== 'attack') {
      abortControllerRef.current?.abort();
    }
  }, [viewMode]);

  // Keyboard shortcut: ⌘/Ctrl+1/2/3 switches tabs within the attack view
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<number>).detail;
      if (typeof detail === 'number' && detail >= 0 && detail <= 2) {
        setTab(detail);
      }
    };
    window.addEventListener('rsa-switch-tab', handler);
    return () => window.removeEventListener('rsa-switch-tab', handler);
  }, []);

  // Load raw source for the Source tab, extracting only the frontendCheck function.
  // All setState calls happen inside .then()/.catch() — never synchronously in the effect body.
  useEffect(() => {
    if (!selectedAttack?.frontendCheck) return;
    let cancelled = false;
    getAttackSource(selectedAttack.id)
      .then(src => {
        if (cancelled) return;
        if (src) {
          const extracted = extractFrontendCheck(src);
          if (extracted) {
            setFrontendCode(extracted);
          } else {
            // Fallback: use toString if extraction fails
            setFrontendCode(dedent(selectedAttack.frontendCheck!.toString()));
          }
        } else {
          // Fallback: use toString if raw source unavailable
          setFrontendCode(dedent(selectedAttack.frontendCheck!.toString()));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setFrontendCode(dedent(selectedAttack.frontendCheck!.toString()));
      });
    return () => { cancelled = true; };
  }, [selectedAttack]);

  if (viewMode !== 'attack') return null;

  if (!selectedAttack) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
        <Typography variant="body1" sx={{ color: draculaColors.comment, fontStyle: 'italic' }}>
          Select an attack from the sidebar
        </Typography>
      </Box>
    );
  }

  // Auto-select source mode based on what's available
  const hasSage = !!selectedAttack.sageTemplate;
  const hasFrontend = !!selectedAttack.frontendCheck;
  if (tab === 2 && sourceMode === 'sage' && !hasSage && hasFrontend) {
    // Can't use setSourceMode here (render phase), so derive it inline
  }
  const effectiveSourceMode = !hasSage ? 'frontend' : !hasFrontend ? 'sage' : sourceMode;
  const pythonCode = hasSage
    ? selectedAttack.sageTemplate!(Object.fromEntries(selectedAttack.inputs.map(f => [f.name, f.name])))
    : '';
  // frontendCode is now loaded asynchronously via useEffect below
  const handleCopySource = () => {
    const code = effectiveSourceMode === 'sage' ? pythonCode : frontendCode;
    void navigator.clipboard.writeText(code);
  };

  const handleInputChange = (name: string, value: string) => {
    setInputValues(prev => ({ ...prev, [name]: value }));
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    cancelCurrentRun();
    dispatchProgress({ type: 'DONE' });
    timer.stop();
  };

  const handleGenerateTestcase = () => {
    const gen = testcaseGenerators[selectedAttack.id];
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

  const handleRun = async () => {
    setTestcaseMsg(null);
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    dispatchProgress({ type: 'START' });
    estimatorRef.current.reset();
    setEta(null);
    timer.start();
    setOutputResult(null);
    setOutputError(null);
    ownershipRef.current = 'input';
    setOutputSource('input');
    const currentAttackId = selectedAttack.id;
    attackIdRef.current = currentAttackId;

    // Strip whitespace from input values (e.g. spaces in numbers pasted from websites).
    // For multiline fields, preserve newlines — they're used as value separators.
    const vals: Record<string, string> = {};
    for (const [key, value] of Object.entries(inputValues)) {
      const field = selectedAttack.inputs.find(f => f.name === key);
      vals[key] = field?.multiline
        ? value.replace(/[^\S\n]/g, '')  // strip horizontal whitespace only, preserve newlines
        : value.replace(/\s/g, '');       // strip ALL whitespace for single-line inputs
    }

    const missingFields = selectedAttack.inputs
      .flatMap(f => (f.required !== false && !vals[f.name]?.trim()) ? [f.label || f.name] : []);
    if (missingFields.length > 0) {
      const msg = `Missing required inputs:\n${missingFields.map(f => `- ${f}`).join('\n')}`;
      if (!mountedRef.current) return;
      if (ownershipRef.current !== 'input') return;
      setOutputError(msg);
      if (!mountedRef.current) return;
      addToHistory(selectedAttack.id, selectedAttack.name, msg, false);
      dispatchProgress({ type: 'DONE' });
      timer.stop();
      return;
    }

    try {
      if (selectedAttack.frontendCheck) {
        const handleProgress = (pct: number, detail?: string) => {
          dispatchProgress({ type: 'PROGRESS', pct, detail });
          const est = estimatorRef.current.update(pct);
          const now = Date.now();
          if (now - lastEtaUpdate.current > 500) {
            lastEtaUpdate.current = now;
            setEta(est.formattedEta);
          }
        };
        const preResult = await runAttack(selectedAttack.id, vals, handleProgress);
        if (preResult !== null) {
          if (attackIdRef.current !== currentAttackId) return;
          let displayPreResult = preResult;
          const decryptedPre = autoDecrypt(selectedAttack, vals, preResult);
          if (decryptedPre) displayPreResult += '\n\n## Decrypted message\n' + decryptedPre;
          if (!mountedRef.current) return;
          if (ownershipRef.current !== 'input') return;
          setOutputResult(displayPreResult);
          dispatchProgress({ type: 'DONE' });
          setEta(null);
          timer.stop();
          if (!mountedRef.current) return;
          addToHistory(selectedAttack.id, selectedAttack.name, preResult, isActualSuccess(preResult));
          const preSuccess = isActualSuccess(preResult);
          if (!mountedRef.current) return;
          showNotification(`${selectedAttack.name}: ${preSuccess ? 'success' : 'failed'}`, preSuccess ? 'success' : 'error');
          if (preSuccess) submitToFactorDB(selectedAttack, preResult, vals.n, showNotification);
          timer.stop();
          return;
        }
      }

      const code = selectedAttack.sageTemplate?.(vals);
      if (!code) {
        if (!mountedRef.current) return;
        if (selectedAttack.frontendCheck) {
          setOutputError('Frontend check returned no result — no SageMath fallback available for this attack');
        } else {
          setOutputError('No SageMath template available for this attack');
        }
        return;
      }
      if (attackIdRef.current !== currentAttackId) return;
      const result = await execute(code, DEFAULT_SAGE_TIMEOUT, controller.signal);
      if (result.success) {
        let displayStdout = result.stdout;
        const decryptedSage = autoDecrypt(selectedAttack, vals, result.stdout);
        if (decryptedSage) displayStdout += '\n\n## Decrypted message\n' + decryptedSage;
        if (!mountedRef.current) return;
        if (ownershipRef.current !== 'input') return;
        setOutputResult(displayStdout);
        dispatchProgress({ type: 'DONE' });
        setEta(null);
        timer.stop();
        if (!mountedRef.current) return;
        addToHistory(selectedAttack.id, selectedAttack.name, result.stdout, isActualSuccess(result.stdout));
        const runSuccess = isActualSuccess(result.stdout);
        if (!mountedRef.current) return;
        showNotification(`${selectedAttack.name}: ${runSuccess ? 'success' : 'failed'}`, runSuccess ? 'success' : 'error');
        if (runSuccess) submitToFactorDB(selectedAttack, result.stdout, vals.n, showNotification);
      } else {
        if (!mountedRef.current) return;
        if (ownershipRef.current !== 'input') return;
        setOutputError(result.error || 'SageCell execution failed with no specific error. Check that all required inputs are filled.');
        if (!mountedRef.current) return;
        addToHistory(selectedAttack.id, selectedAttack.name, result.error || 'SageCell execution failed with no specific error. Check that all required inputs are filled.', false);
      }
    } catch (err: unknown) {
      if (attackIdRef.current !== currentAttackId) { return; }
      const message = err instanceof Error ? err.message : 'Execution failed';
      if (!mountedRef.current) return;
      if (ownershipRef.current !== 'input') return;
      setOutputError(message);
      if (!mountedRef.current) return;
      addToHistory(selectedAttack.id, selectedAttack.name, message, false);
    } finally {
      if (attackIdRef.current === currentAttackId && ownershipRef.current === 'input') {
        timer.stop();
        dispatchProgress({ type: 'DONE' });
        setEta(null);
        abortControllerRef.current = null;
        ownershipRef.current = null;
        setOutputSource(null);
      }
    }
  };

  return (
    <Box sx={colFlexSx}>
      {/* Tabs at top-left */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as number)}
        sx={{
          minHeight: 40,
          px: 2,
          pt: 2,
          '& .MuiTabs-flexContainer': { justifyContent: 'flex-start' },
          '& .MuiTab-root': { ...tabSx, px: 3 },
          '& .Mui-selected': { color: draculaColors.purple },
          '& .MuiTabs-indicator': { backgroundColor: draculaColors.purple },
        }}
      >
        <Tab label="Explanation" />
        <Tab label="Input" data-testid="input-tab" />
        <Tab label="Source" data-testid="source-tab" />
      </Tabs>

      {/* Explanation tab - left aligned */}
      {tab === 0 && (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {selectedAttack.proof ? (
            <ProofRenderer latex={selectedAttack.proof} />
          ) : (
            <Typography variant="body2" sx={{ color: draculaColors.comment, fontStyle: 'italic' }}>
              No proof available.
            </Typography>
          )}

          {selectedAttack.usageGuide && (
            <>
              <Divider sx={{ borderColor: draculaColors.comment, my: 2 }} />
              <Typography
                variant="h5"
                sx={{ color: draculaColors.cyan, mb: 1, fontFamily: "'JetBrains Mono', monospace" }}
              >
                How to Use
              </Typography>
              <Typography
                sx={{ color: draculaColors.foreground, fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6 }}
              >
                {selectedAttack.usageGuide}
              </Typography>
            </>
          )}
        </Box>
      )}

      {/* Input tab - center aligned */}
      {tab === 1 && (
        <Box sx={{ ...centeredPanelSx, p: 2 }}>
          <Box sx={{ width: '100%', maxWidth: 500, pb: '30vh' }}>
            <Typography variant="h4" sx={{ color: draculaColors.cyan, mb: 0.5 }}>
              {selectedAttack.name}
            </Typography>
            <Typography variant="caption" sx={{ color: draculaColors.pink, display: 'block', mb: 1, fontSize: '0.7rem' }}>
              {selectedAttack.frontendCheck ? 'Runs locally in browser' : 'Executed via SageMathCell'}
            </Typography>
            <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 3, fontFamily: "'JetBrains Mono', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}>
              {selectedAttack.description}
            </Typography>

            {selectedAttack.inputs.map(field => (
              <Box key={field.name} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={field.required === false ? `${field.label} (optional)` : field.label}
                  placeholder={field.placeholder}
                  value={inputValues[field.name] || ''}
                  onChange={e => handleInputChange(field.name, e.target.value)}
                  multiline={field.multiline}
                  rows={field.rows || 1}
                  required={field.required !== false}
                  variant="outlined"
                  size="small"
                  helperText={field.tooltip}
                  sx={inputSx}
                />
              </Box>
            ))}

            <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGenerateTestcase}
                data-testid="generate-testcase"
                sx={colorGhostBtn(draculaColors.cyan)}
                startIcon={<Casino sx={{ fontSize: '1rem' }} />}
              >
                Generate
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={loading ? handleStop : () => { void handleRun(); }}
                data-testid={loading ? 'stop-attack' : 'run-attack'}
                sx={colorGhostBtn(loading ? draculaColors.red : draculaColors.purple)}
                startIcon={loading ? <Stop /> : undefined}
              >
                {loading ? 'Stop' : 'Run'}
              </Button>
            </Box>

            {loading ? (
              <Typography variant="body2" sx={{ color: draculaColors.orange, mt: 1, mb: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <HourglassEmpty data-testid="loading-spinner" sx={{ color: draculaColors.orange, fontSize: '1rem', animation: `${hourglassSpin} 3s ease-in-out infinite` }} />
                Running… {timer.formatted}
              </Typography>
            ) : testcaseMsg ? (
              <Typography variant="body2" sx={{ color: draculaColors.orange, mt: 1, mb: 2, textAlign: 'center' }}>
                {testcaseMsg}
              </Typography>
            ) : null}

            {loading && progress > 0 && progress < 100 && (
              <Box sx={{ mt: 1.5, width: '100%', maxWidth: 300, mx: 'auto' }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: draculaColors.currentLine,
                    '& .MuiLinearProgress-bar': { bgcolor: draculaColors.orange, borderRadius: 3 },
                  }}
                />
                <Typography variant="caption" sx={{ color: draculaColors.orange, mt: 0.5, textAlign: 'center', display: 'block' }}>
                  {progress}%{progressDetail ? ` — ${progressDetail}` : ''}
                </Typography>
                {eta && (
                  <Typography variant="caption" sx={{ color: draculaColors.orange, mt: 0.5, textAlign: 'center', display: 'block' }}>
                    {eta} remaining
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Source tab */}
      {tab === 2 && (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      {hasSage && (
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSourceMode('sage')}
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            textTransform: 'none',
            color: effectiveSourceMode === 'sage' ? draculaColors.purple : draculaColors.comment,
            borderColor: effectiveSourceMode === 'sage' ? draculaColors.purple : draculaColors.comment,
            backgroundColor: effectiveSourceMode === 'sage' ? draculaColors.currentLine : 'transparent',
            '&:hover': {
              borderColor: draculaColors.purple,
              color: draculaColors.purple,
              backgroundColor: draculaColors.currentLine,
            },
          }}
        >
          SageMath (Python)
        </Button>
      )}
      {hasFrontend && (
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSourceMode('frontend')}
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            textTransform: 'none',
            color: effectiveSourceMode === 'frontend' ? draculaColors.purple : draculaColors.comment,
            borderColor: effectiveSourceMode === 'frontend' ? draculaColors.purple : draculaColors.comment,
            backgroundColor: effectiveSourceMode === 'frontend' ? draculaColors.currentLine : 'transparent',
            '&:hover': {
              borderColor: draculaColors.purple,
              color: draculaColors.purple,
              backgroundColor: draculaColors.currentLine,
            },
          }}
        >
          Frontend (TypeScript)
        </Button>
      )}
    </Box>
          <Box sx={{
            borderRadius: 1,
            border: `1px solid ${draculaColors.comment}`,
            overflow: 'hidden',
          }}>
            <SyntaxHighlighter
              language={effectiveSourceMode === 'sage' ? 'python' : 'typescript'}
              style={draculaSourceTheme}
              customStyle={{
                margin: 0,
                borderRadius: 'inherit',
                fontSize: '0.8rem',
                fontFamily: FONT_FAMILY,
                maxHeight: '50vh',
              }}
            >
              {effectiveSourceMode === 'sage' ? pythonCode : frontendCode}
            </SyntaxHighlighter>
          </Box>

          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleCopySource}
              sx={ghostBtnSx}
              startIcon={<ContentCopy />}
            >
              Copy
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
