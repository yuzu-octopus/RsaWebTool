import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Stop, Casino } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { useSageMath, DEFAULT_SAGE_TIMEOUT } from '../hooks/useSageMath';
import { useWorkerPool } from '../hooks/useWorkerPool';
import { ProofRenderer } from './ProofRenderer';
import { testcaseGenerators, submitToFactorDB, autoDecrypt } from '../attacks';
import { isActualSuccess } from '../utils/sage-output';
import { inputSx } from '../styles/inputSx';
import { colFlexSx, centeredPanelSx, tabSx, colorGhostBtn } from '../styles/shared';
import { useTimer } from '../hooks/useTimer';

export function InputPanel() {
  const { selectedAttack, viewMode, setOutputResult, setOutputError, addToHistory, showNotification } = useAppContext();
  const { execute } = useSageMath();
  const [tab, setTab] = useState(0);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const attackIdRef = useRef<string | null>(null);
  const [testcaseMsg, setTestcaseMsg] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const timeoutIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
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
    setLoading(true);
    timer.start();
    setOutputResult(null);
    setOutputError(null);
    const currentAttackId = selectedAttack.id;
    attackIdRef.current = currentAttackId;
    try {
      if (selectedAttack.frontendCheck) {
        const preResult = await runAttack(selectedAttack.id, inputValues);
        if (preResult !== null) {
          if (attackIdRef.current !== currentAttackId) return;
          let displayPreResult = preResult;
          const decryptedPre = autoDecrypt(selectedAttack, inputValues, preResult);
          if (decryptedPre) displayPreResult += '\n\n## Decrypted message\n' + decryptedPre;
          setOutputResult(displayPreResult);
          addToHistory(selectedAttack.id, selectedAttack.name, preResult, isActualSuccess(preResult));
          const preSuccess = isActualSuccess(preResult);
          showNotification(`${selectedAttack.name}: ${preSuccess ? 'success' : 'failed'}`, preSuccess ? 'success' : 'error');
          if (preSuccess) submitToFactorDB(selectedAttack, preResult, inputValues.n, showNotification);
          timer.stop();
          setLoading(false);
          return;
        }
      }

      const code = selectedAttack.sageTemplate(inputValues);
      const result = await execute(code, DEFAULT_SAGE_TIMEOUT, controller.signal);
      if (attackIdRef.current !== currentAttackId) return;
      if (result.success) {
        let displayStdout = result.stdout;
        const decryptedSage = autoDecrypt(selectedAttack, inputValues, result.stdout);
        if (decryptedSage) displayStdout += '\n\n## Decrypted message\n' + decryptedSage;
        setOutputResult(displayStdout);
        addToHistory(selectedAttack.id, selectedAttack.name, result.stdout, isActualSuccess(result.stdout));
        const runSuccess = isActualSuccess(result.stdout);
        showNotification(`${selectedAttack.name}: ${runSuccess ? 'success' : 'failed'}`, runSuccess ? 'success' : 'error');
        if (runSuccess) submitToFactorDB(selectedAttack, result.stdout, inputValues.n, showNotification);
      } else {
        setOutputError(result.error || 'Unknown error');
        addToHistory(selectedAttack.id, selectedAttack.name, result.error || 'Unknown error', false);
      }
    } catch (err: unknown) {
      if (attackIdRef.current !== currentAttackId) { return; }
      const message = err instanceof Error ? err.message : 'Execution failed';
      setOutputError(message);
      addToHistory(selectedAttack.id, selectedAttack.name, message, false);
    } finally {
      if (attackIdRef.current === currentAttackId) {
        timer.stop();
        setLoading(false);
        abortControllerRef.current = null;
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
            <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 3, fontFamily: "'JetBrains Mono', monospace" }}>
              {selectedAttack.description}
            </Typography>

            {selectedAttack.inputs.map(field => (
              <Box key={field.name} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label={field.label}
                  placeholder={field.placeholder}
                  value={inputValues[field.name] || ''}
                  onChange={e => handleInputChange(field.name, e.target.value)}
                  multiline={field.multiline}
                  rows={field.rows || 1}
                  variant="outlined"
                  size="small"
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
                <Typography variant="body2" sx={{ color: draculaColors.orange, mt: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <CircularProgress size={16} data-testid="loading-spinner" sx={{ color: draculaColors.orange }} />
                  Running... {timer.formatted}
                </Typography>
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
    </Box>
  );
}
