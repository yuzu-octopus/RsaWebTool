import { useState, useReducer, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  LinearProgress,
  Divider,
} from '@mui/material';
import { Stop, Casino, ContentCopy } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { useSageMath, DEFAULT_SAGE_TIMEOUT } from '../hooks/useSageMath';
import { useWorkerPool } from '../hooks/useWorkerPool';
import { ProofRenderer } from './ProofRenderer';
import { testcaseGenerators, submitToFactorDB, autoDecrypt } from '../attacks';
import { isActualSuccess } from '../utils/sageOutput';
import { inputSx } from '../styles/inputSx';
import { colFlexSx, centeredPanelSx, tabSx, colorGhostBtn } from '../styles/shared';
import { useTimer } from '../hooks/useTimer';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula as draculaStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';

export function InputPanel() {
  const { selectedAttack, viewMode, setOutputResult, setOutputError, setOutputSource, addToHistory, showNotification } = useAppContext();
  const { execute } = useSageMath();
  const [tab, setTab] = useState(0);
  const [sourceMode, setSourceMode] = useState<'sage' | 'frontend'>('sage');
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
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
  const [progressState, dispatchProgress] = useReducer(progressReducer, initialProgress);
  const loading = progressState.loading;
  const progress = progressState.pct;
  const progressDetail = progressState.detail;
  const abortControllerRef = useRef<AbortController | null>(null);
  const attackIdRef = useRef<string | null>(null);
  const [testcaseMsg, setTestcaseMsg] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const ownershipRef = useRef<'input' | 'magic' | null>(null);
  const timer = useTimer();
  const { runAttack } = useWorkerPool();
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

  const pythonCode = selectedAttack.sageTemplate(
    Object.fromEntries(selectedAttack.inputs.map(f => [f.name, f.name]))
  );
  const frontendCode = selectedAttack.frontendCheck
    ? selectedAttack.frontendCheck.toString()
    : '';
  const handleCopySource = () => {
    const code = sourceMode === 'sage' ? pythonCode : frontendCode;
    void navigator.clipboard.writeText(code);
  };

  const handleInputChange = (name: string, value: string) => {
    setInputValues(prev => ({ ...prev, [name]: value }));
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
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
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    dispatchProgress({ type: 'START' });
    timer.start();
    setOutputResult(null);
    setOutputError(null);
    ownershipRef.current = 'input';
    setOutputSource('input');
    const currentAttackId = selectedAttack.id;
    attackIdRef.current = currentAttackId;

    // Strip all whitespace from input values (e.g. spaces in numbers pasted from websites)
    const vals: Record<string, string> = {};
    for (const [key, value] of Object.entries(inputValues)) {
      vals[key] = value.replace(/\s/g, '');
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

      const code = selectedAttack.sageTemplate(vals);
      if (attackIdRef.current !== currentAttackId) return;
      const result = await execute(code, DEFAULT_SAGE_TIMEOUT, controller.signal);
      if (result.success) {
        let displayStdout = result.stdout;
        const decryptedSage = autoDecrypt(selectedAttack, vals, result.stdout);
        if (decryptedSage) displayStdout += '\n\n## Decrypted message\n' + decryptedSage;
        if (!mountedRef.current) return;
        if (ownershipRef.current !== 'input') return;
        setOutputResult(displayStdout);
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
                Generate Testcase
              </Button>
            </Box>

            {testcaseMsg && (
              <Typography variant="body2" sx={{ color: draculaColors.orange, mt: 1, mb: 2, textAlign: 'center' }}>
                {testcaseMsg}
              </Typography>
            )}

            {loading ? (
              <>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleStop}
                  sx={colorGhostBtn(draculaColors.red)}
                >
                  <Stop sx={{ mr: 1 }} /> Stop
                </Button>
                <Typography variant="body2" sx={{ color: draculaColors.orange, mt: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CircularProgress size={16} data-testid="loading-spinner" sx={{ color: draculaColors.orange }} />
                    Running… {timer.formatted}
                </Typography>
                {progress > 0 && (
                  <Box sx={{ mt: 1.5, width: '100%', maxWidth: 300, mx: 'auto' }}>
                    <LinearProgress
                      variant="determinate"
                      value={progress}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: draculaColors.currentLine,
                        '& .MuiLinearProgress-bar': { bgcolor: draculaColors.cyan, borderRadius: 3 },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: draculaColors.comment, mt: 0.5, textAlign: 'center', display: 'block' }}>
                      {progress}%{progressDetail ? ` — ${progressDetail}` : ''}
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Button
                fullWidth
                variant="outlined"
                onClick={() => { void handleRun(); }}
                data-testid="run-attack"
                sx={colorGhostBtn(draculaColors.purple)}
              >
                Run
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Source tab */}
      {tab === 2 && (
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      <Button
        size="small"
        variant="outlined"
        onClick={() => setSourceMode('sage')}
        sx={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.75rem',
          textTransform: 'none',
          color: sourceMode === 'sage' ? draculaColors.purple : draculaColors.comment,
          borderColor: sourceMode === 'sage' ? draculaColors.purple : draculaColors.comment,
          backgroundColor: sourceMode === 'sage' ? draculaColors.currentLine : 'transparent',
          '&:hover': {
            borderColor: draculaColors.purple,
            color: draculaColors.purple,
            backgroundColor: draculaColors.currentLine,
          },
        }}
      >
        SageMath (Python)
      </Button>
      {selectedAttack.frontendCheck && (
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSourceMode('frontend')}
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            textTransform: 'none',
            color: sourceMode === 'frontend' ? draculaColors.purple : draculaColors.comment,
            borderColor: sourceMode === 'frontend' ? draculaColors.purple : draculaColors.comment,
            backgroundColor: sourceMode === 'frontend' ? draculaColors.currentLine : 'transparent',
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
              language={sourceMode === 'sage' ? 'python' : 'typescript'}
              style={draculaStyle}
              customStyle={{
                margin: 0,
                borderRadius: 'inherit',
                fontSize: '0.8rem',
                maxHeight: '50vh',
              }}
            >
              {sourceMode === 'sage' ? pythonCode : frontendCode}
            </SyntaxHighlighter>
          </Box>

          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleCopySource}
              sx={{
                color: draculaColors.comment,
                borderColor: draculaColors.comment,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.7rem',
                '&:hover': { borderColor: draculaColors.purple, color: draculaColors.purple },
              }}
              startIcon={<ContentCopy sx={{ fontSize: '0.85rem' }} />}
            >
              Copy
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
