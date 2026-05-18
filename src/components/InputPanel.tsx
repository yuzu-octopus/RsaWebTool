import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  CircularProgress,
} from '@mui/material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../context/AppContext';
import { useSageMath } from '../hooks/useSageMath';
import { ProofRenderer } from './ProofRenderer';

const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: draculaColors.currentLine,
    color: draculaColors.foreground,
    fontFamily: "'JetBrains Mono', monospace",
    '& fieldset': { borderColor: draculaColors.comment },
    '&:hover fieldset': { borderColor: draculaColors.purple },
    '&.Mui-focused fieldset': { borderColor: draculaColors.purple },
  },
  '& .MuiInputLabel-root': {
    color: draculaColors.comment,
    fontFamily: "'JetBrains Mono', monospace",
    '&.Mui-focused': { color: draculaColors.purple },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'JetBrains Mono', monospace",
  },
};

export function InputPanel() {
  const { selectedAttack, viewMode, setOutputResult, setOutputError, addToHistory } = useAppContext();
  const { execute } = useSageMath();
  const [tab, setTab] = useState(0);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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

  const handleRun = async () => {
    setLoading(true);
    setOutputResult(null);
    setOutputError(null);
    try {
      if (selectedAttack.frontendCheck) {
        const preResult = await selectedAttack.frontendCheck(inputValues);
        if (preResult !== null) {
          setOutputResult(preResult);
          addToHistory(selectedAttack.id, selectedAttack.name, preResult, true);
          setLoading(false);
          return;
        }
      }

      const code = selectedAttack.sageTemplate(inputValues);
      const result = await execute(code);
      if (result.success) {
        setOutputResult(result.stdout);
        addToHistory(selectedAttack.id, selectedAttack.name, result.stdout, true);
      } else {
        setOutputError(result.error || 'Unknown error');
        addToHistory(selectedAttack.id, selectedAttack.name, result.error || 'Unknown error', false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Execution failed';
      setOutputError(message);
      addToHistory(selectedAttack.id, selectedAttack.name, message, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Tabs at top-left */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          minHeight: 40,
          px: 2,
          pt: 2,
          '& .MuiTabs-flexContainer': {
            justifyContent: 'flex-start',
          },
          '& .MuiTab-root': {
            color: draculaColors.comment,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.85rem',
            textTransform: 'none',
            minHeight: 40,
            px: 3,
          },
          '& .Mui-selected': { color: draculaColors.purple },
          '& .MuiTabs-indicator': { backgroundColor: draculaColors.purple },
        }}
      >
        <Tab label="Explanation" />
        <Tab label="Input" />
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
        </Box>
      )}

      {/* Input tab - center aligned */}
      {tab === 1 && (
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
          <Box sx={{ width: '100%', maxWidth: 500 }}>
            <Typography variant="h4" sx={{ color: draculaColors.cyan, mb: 1 }}>
              {selectedAttack.name}
            </Typography>
            <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 3 }}>
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

            <Button
              fullWidth
              variant="contained"
              onClick={handleRun}
              disabled={loading}
              sx={{
                mt: 2,
                backgroundColor: draculaColors.purple,
                fontFamily: "'JetBrains Mono', monospace",
                '&:hover': { backgroundColor: '#a575f6' },
                '&:disabled': { backgroundColor: draculaColors.comment },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: draculaColors.foreground }} /> : 'Run'}
            </Button>

            {loading && (
              <Typography variant="body2" sx={{ color: draculaColors.comment, mt: 1, textAlign: 'center' }}>
                Computing in SageMathCell...
              </Typography>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
