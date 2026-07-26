import { type ChangeEvent, useState, useEffect, useEffectEvent, useMemo, useCallback, useRef } from 'react';
import type { Attack } from '../types';
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
import { Stop, Casino, ContentCopy, HourglassEmpty, ArrowForward } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { useSageMath } from '../hooks/useSageMath';
import { useWorkerPool } from '../hooks/useWorkerPool';
import { useAttackExecution } from '../hooks/useAttackExecution';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { ProofRenderer } from './ProofRenderer';
import { EmptyState } from './_shared/EmptyState';
import { inputSx } from '../styles/shared';
import { colFlexSx, centeredPanelSx, tabSx, colorGhostBtn, ghostBtnSx, hourglassSpin, pageTitleSx, MONO_FAMILY, PROSE_FAMILY } from '../styles/shared';
import Prism from 'prismjs';
import '../styles/draculaPrism.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import { getAttackSource, extractFrontendCheck, dedent } from '../attacks/rawSources';

export function InputPanel() {
  const { selectedAttack, viewMode } = useAppContext();

  if (viewMode !== 'attack') return null;

  if (!selectedAttack) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
        <EmptyState title="Select an attack from the sidebar" padding={4} />
      </Box>
    );
  }

  return <AttackPanel key={selectedAttack.id} attack={selectedAttack} />;
}

function AttackPanel({ attack }: { attack: Attack }) {
  const { viewMode, outputResult, setOutputResult, setOutputError, setOutputSource, addToHistory, showNotification } = useAppContext();
  const { execute } = useSageMath();
  const [tab, setTab] = useState(0);
  const [sourceMode, setSourceMode] = useState<'sage' | 'frontend'>('sage');
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});
  const [frontendCode, setFrontendCode] = useState('');
  const { copied, copy } = useCopyToClipboard();
  const { runAttack, cancelCurrentRun } = useWorkerPool();
  const { handleRun, handleStop, handleGenerateTestcase, testcaseMsg, isRunning, progress, progressDetail, timer, eta } = useAttackExecution(
    execute, runAttack, cancelCurrentRun,
    { setOutputResult, setOutputError, setOutputSource, addToHistory, showNotification, setInputValues },
  );
  const handleCopy = useCallback(async (text: string) => {
    if (!await copy(text)) showNotification('Could not copy to clipboard.', 'error');
  }, [copy, showNotification]);


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

  const handleValidatedRun = useCallback((values: Record<string, string>) => {
    const missingFields = attack.inputs.filter(field => field.required !== false && !values[field.name]?.trim());
    if (missingFields.length === 0) {
      void handleRun(attack, values);
      return;
    }

    setFieldErrors(Object.fromEntries(missingFields.map(field => [field.name, `${field.label} is required.`])));
    setOutputError('Complete the highlighted required fields before running this attack.');
    requestAnimationFrame(() => inputRefs.current[missingFields[0].name]?.focus());
  }, [attack, handleRun, setOutputError]);

  // Keyboard shortcut: ⌘+Enter to run attack, ⌘+Shift+C to copy output
  const runShortcut = useEffectEvent(() => {
    if (viewMode === 'attack' && !isRunning) {
      handleValidatedRun(inputValues);
    }
  });
  const copyShortcut = useEffectEvent(() => {
    if (viewMode === 'attack' && outputResult) {
      void handleCopy(outputResult);
    }
  });
  useEffect(() => {
    window.addEventListener('rsa-run-attack', runShortcut);
    window.addEventListener('rsa-copy-output', copyShortcut);
    return () => {
      window.removeEventListener('rsa-run-attack', runShortcut);
      window.removeEventListener('rsa-copy-output', copyShortcut);
    };
  }, []);

  // Load raw source for the Source tab, extracting only the frontendCheck function.
  // All setState calls happen inside .then()/.catch() — never synchronously in the effect body.
  useEffect(() => {
    const frontendCheck = attack.frontendCheck;
    if (!frontendCheck) return;
    let cancelled = false;
    getAttackSource(attack.id)
      .then(src => {
        if (cancelled) return;
        if (src) {
          const extracted = extractFrontendCheck(src);
          if (extracted) {
            setFrontendCode(extracted);
          } else {
            // Fallback: use toString if extraction fails
            setFrontendCode(dedent(frontendCheck.toString()));
          }
        } else {
          // Fallback: use toString if raw source unavailable
            setFrontendCode(dedent(frontendCheck.toString()));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setFrontendCode(dedent(frontendCheck.toString()));
      });
    return () => { cancelled = true; };
  }, [attack]);

  const hasSage = !!attack.sageTemplate;
  const hasFrontend = !!attack.frontendCheck;
  const pythonCode = useMemo(() => {
    if (!attack.sageTemplate) return '';
    return attack.sageTemplate(Object.fromEntries(attack.inputs.map(f => [f.name, f.name])));
  }, [attack]);

  const effectiveSourceMode = !hasSage ? 'frontend' : !hasFrontend ? 'sage' : sourceMode;
  // handleCopySource is a useCallback — must be defined before any early returns (Rules of Hooks)
  const handleCopySource = useCallback(() => {
    const code = effectiveSourceMode === 'sage' ? pythonCode : frontendCode;
    void handleCopy(code);
  }, [effectiveSourceMode, frontendCode, handleCopy, pythonCode]);


  const handleInputChange = (name: string, value: string, multiline: boolean) => {
    const normalizedValue = multiline ? value : value.replace(/\s/g, '');
    setInputValues(prev => ({ ...prev, [name]: normalizedValue }));
    if (normalizedValue.trim()) {
      setFieldErrors(({ [name]: _error, ...rest }) => rest);
    }
  };

  return (
    <Box sx={colFlexSx}>
      {/* Tabs at top-left */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v as number)}
        sx={{
          minHeight: 48,
          px: 2,
          '& .MuiTabs-flexContainer': { justifyContent: 'flex-start' },
          '& .MuiTab-root': { ...tabSx, px: 3 },
          '& .Mui-selected': { color: draculaColors.purple },
          '& .MuiTabs-indicator': { backgroundColor: draculaColors.purple },
        }}
      >
        <Tab id="attack-tab-0" aria-controls="attack-tabpanel-0" label="Explanation" />
        <Tab id="attack-tab-1" aria-controls="attack-tabpanel-1" label="Input" data-testid="input-tab" />
        <Tab id="attack-tab-2" aria-controls="attack-tabpanel-2" label="Source" data-testid="source-tab" />
      </Tabs>

      {/* Explanation tab - left aligned */}
      {tab === 0 && (
        <Box role="tabpanel" id="attack-tabpanel-0" aria-labelledby="attack-tab-0" sx={{ flex: 1, overflow: 'auto', p: 2, pb: '20vh' }}>
          {attack.proof ? (
            <ProofRenderer latex={attack.proof} />
          ) : (
            <Typography variant="body2" sx={{ color: draculaColors.comment, fontStyle: 'italic' }}>
              No proof available.
            </Typography>
          )}

          {attack.usageGuide && (
            <>
              <Divider sx={{ borderColor: draculaColors.comment, my: 2 }} />
              <Typography
                variant="h5"
                sx={{ color: draculaColors.cyan, mb: 1, fontFamily: MONO_FAMILY }}
              >
                How to Use
              </Typography>
              <Typography
                sx={{ color: draculaColors.foreground, fontSize: '0.85rem', whiteSpace: 'pre-wrap', fontFamily: MONO_FAMILY, lineHeight: 1.6 }}
              >
                {attack.usageGuide}
              </Typography>
            </>
          )}
          <Button
            endIcon={<ArrowForward />}
            onClick={() => setTab(1)}
            sx={{ mt: 2, color: draculaColors.purple, borderColor: draculaColors.purple, '&:hover': { borderColor: draculaColors.purple, backgroundColor: `${draculaColors.purple}22` } }}
            variant="outlined"
          >
            Continue to Input
          </Button>
        </Box>
      )}

      {/* Input tab - center aligned */}
      {tab === 1 && (
        <Box role="tabpanel" id="attack-tabpanel-1" aria-labelledby="attack-tab-1" sx={{ ...centeredPanelSx, p: 2 }}>
          <Box sx={{ width: '100%', maxWidth: 640 }}>
            <Typography variant="h3" sx={pageTitleSx}>
              {attack.name}
            </Typography>
            <Typography variant="caption" sx={{ color: draculaColors.pink, display: 'block', mb: 1, fontSize: '0.7rem' }}>
              {attack.frontendCheck ? 'Runs locally in browser' : 'Executed via SageMathCell'}
            </Typography>
            <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 3, fontFamily: PROSE_FAMILY }}>
              {attack.description}
            </Typography>

            {attack.inputs.map(field => (
              <Box key={field.name} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={field.required === false ? `${field.label} (optional)` : field.label}
                  placeholder={field.placeholder}
                  value={inputValues[field.name] || ''}
                  onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInputChange(field.name, e.target.value, field.multiline === true)}
                  inputRef={(node: HTMLInputElement | HTMLTextAreaElement | null) => { inputRefs.current[field.name] = node; }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !field.multiline && !isRunning) {
                      e.preventDefault();
                      handleValidatedRun(inputValues);
                    }
                  }}
                  multiline={field.multiline}
                  rows={field.rows || 1}
                  required={field.required !== false}
                  variant="outlined"
                  size="small"
                  error={Boolean(fieldErrors[field.name])}
                  helperText={fieldErrors[field.name] || field.tooltip}
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
                onClick={isRunning ? handleStop : () => handleValidatedRun(inputValues)}
                data-testid={isRunning ? 'stop-attack' : 'run-attack'}
                sx={colorGhostBtn(isRunning ? draculaColors.red : draculaColors.purple)}
                startIcon={isRunning ? <Stop /> : undefined}
              >
                {isRunning ? 'Stop' : 'Run'}
              </Button>
            </Box>

            {isRunning ? (
              <Typography variant="body2" sx={{ color: draculaColors.orange, mt: 1, mb: 2, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <HourglassEmpty data-testid="loading-spinner" sx={{ color: draculaColors.orange, fontSize: '1rem', animation: `${hourglassSpin} 3s ease-in-out infinite` }} />
                Running… {timer.formatted}
              </Typography>
            ) : testcaseMsg ? (
              <Typography variant="body2" sx={{ color: draculaColors.orange, mt: 1, mb: 2, textAlign: 'center' }}>
                {testcaseMsg}
              </Typography>
            ) : null}

            {isRunning && progress > 0 && (
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
        <Box role="tabpanel" id="attack-tabpanel-2" aria-labelledby="attack-tab-2" sx={{ flex: 1, overflow: 'auto', p: 2, pb: '20vh' }}>
    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
      {hasSage && (
        <Button
          size="small"
          variant="outlined"
          onClick={() => setSourceMode('sage')}
          sx={{
            fontFamily: MONO_FAMILY,
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
            fontFamily: MONO_FAMILY,
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
            <Box
              component="pre"
              sx={{
                margin: 0,
                borderRadius: 'inherit',
                fontSize: '0.8rem',
                fontFamily: MONO_FAMILY,
                maxHeight: '50vh',
                overflow: 'auto',
                p: 1.5,
                lineHeight: '1.5',
              }}
              // SAFE: Prism.highlight returns syntax-highlighted HTML containing
              // only <span> tags with class names — no executable script, no
              // user-supplied HTML. Source code is bundled with each attack
              // definition (not arbitrary user input).
              dangerouslySetInnerHTML={{
                __html: Prism.highlight(
                  effectiveSourceMode === 'sage' ? pythonCode : frontendCode,
                  effectiveSourceMode === 'sage' ? Prism.languages.python : Prism.languages.typescript,
                  effectiveSourceMode === 'sage' ? 'python' : 'typescript'
                ),
              }}
            />
          </Box>

          <Box sx={{ mt: 1.5 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleCopySource}
              sx={ghostBtnSx}
              startIcon={<ContentCopy />}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
