import { useState, useEffect, useMemo } from 'react';
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
import { useSageMath } from '../hooks/useSageMath';
import { useWorkerPool } from '../hooks/useWorkerPool';
import { useAttackExecution } from '../hooks/useAttackExecution';
import { ProofRenderer } from './ProofRenderer';
import { inputSx } from '../styles/inputSx';
import { colFlexSx, centeredPanelSx, tabSx, colorGhostBtn, ghostBtnSx, FONT_FAMILY } from '../styles/shared';
import Prism from 'prismjs';
import '../styles/draculaPrism.css';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import { getAttackSource, extractFrontendCheck, dedent } from '../attacks/rawSources';

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
  const [frontendCode, setFrontendCode] = useState('');
  const { runAttack, cancelCurrentRun } = useWorkerPool();
  const { handleRun, handleStop, handleGenerateTestcase, testcaseMsg, isRunning, progress, progressDetail, timer, eta } = useAttackExecution(
    execute, runAttack, cancelCurrentRun,
    { setOutputResult, setOutputError, setOutputSource, addToHistory, showNotification, setInputValues },
  );

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

  const hasSage = !!selectedAttack?.sageTemplate;
  const hasFrontend = !!selectedAttack?.frontendCheck;
  const pythonCode = useMemo(() => {
    if (!hasSage) return '';
    return selectedAttack.sageTemplate!(Object.fromEntries(selectedAttack.inputs.map(f => [f.name, f.name])));
  }, [hasSage, selectedAttack]);

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

  const effectiveSourceMode = !hasSage ? 'frontend' : !hasFrontend ? 'sage' : sourceMode;
  // frontendCode is now loaded asynchronously via useEffect below
  const handleCopySource = () => {
    const code = effectiveSourceMode === 'sage' ? pythonCode : frontendCode;
    void navigator.clipboard.writeText(code);
  };

  const handleInputChange = (name: string, value: string) => {
    setInputValues(prev => ({ ...prev, [name]: value }));
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
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: '20vh' }}>
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
          <Box sx={{ width: '100%', maxWidth: 500 }}>
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
                onClick={isRunning ? handleStop : () => { void handleRun(selectedAttack, inputValues); }}
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
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, pb: '20vh' }}>
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
            <Box
              component="pre"
              sx={{
                margin: 0,
                borderRadius: 'inherit',
                fontSize: '0.8rem',
                fontFamily: FONT_FAMILY,
                maxHeight: '50vh',
                overflow: 'auto',
                p: 1.5,
                lineHeight: '1.5',
              }}
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
              Copy
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
