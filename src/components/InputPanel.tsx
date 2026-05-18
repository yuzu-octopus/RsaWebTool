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
    fontFamily: "'JetBrainsMono Nerd Font', monospace",
    '& fieldset': { borderColor: draculaColors.comment },
    '&:hover fieldset': { borderColor: draculaColors.purple },
    '&.Mui-focused fieldset': { borderColor: draculaColors.purple },
  },
  '& .MuiInputLabel-root': {
    color: draculaColors.comment,
    fontFamily: "'JetBrainsMono Nerd Font', monospace",
    '&.Mui-focused': { color: draculaColors.purple },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'JetBrainsMono Nerd Font', monospace",
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
      const code = selectedAttack.sageTemplate(inputValues);
      const result = await execute(code);
      if (result.success) {
        setOutputResult(result.stdout);
        addToHistory(selectedAttack.id, selectedAttack.name, result.stdout, true);
      } else {
        setOutputError(result.error || 'Unknown error');
        addToHistory(selectedAttack.id, selectedAttack.name, result.error || 'Unknown error', false);
      }
    } catch (err: any) {
      setOutputError(err.message || 'Execution failed');
      addToHistory(selectedAttack.id, selectedAttack.name, err.message || 'Execution failed', false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          '& .MuiTab-root': { color: draculaColors.comment, fontFamily: "'JetBrainsMono Nerd Font', monospace" },
          '& .Mui-selected': { color: draculaColors.purple },
          '& .MuiTabs-indicator': { backgroundColor: draculaColors.purple },
        }}
      >
        <Tab label="Run Attack" />
        <Tab label="Proof" />
      </Tabs>

      {tab === 0 && (
        <Box sx={{ p: 2, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 640 }}>
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
                fontFamily: "'JetBrainsMono Nerd Font', monospace",
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

      {tab === 1 && selectedAttack.proof && (
        <ProofRenderer latex={selectedAttack.proof} />
      )}
    </Box>
  );
}
