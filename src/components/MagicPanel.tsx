import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../context/AppContext';
import { useSageMathParallel } from '../hooks/useSageMath';
import { attacks } from '../data/attacks';
import { detectFormat } from '../utils/converters';

function detectParams(input: string): Record<string, string> {
  const params: Record<string, string> = {};
  const kvRegex = /(n|e|c|d|p|q|dp|dq|qinv|dLow|nearp|bound|k|B|a|b|e1|e2|c1|c2|hash_hex|target_m|sig_valid|sig_faulty|k_phi|base|bitOffset|bitLength|num_primes|knownBits|bitPosition|oracle_responses|oracle_runs)\s*=\s*([0-9a-fA-F,\n]+)/g;
  let match;
  while ((match = kvRegex.exec(input)) !== null) {
    params[match[1]] = match[2].trim();
  }
  return params;
}

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

interface MagicJob {
  attackId: string;
  attackName: string;
  status: 'running' | 'success' | 'error';
  result?: string;
  error?: string;
}

export function MagicPanel() {
  const { viewMode, setOutputResult, setOutputError, addToHistory } = useAppContext();
  const { executeAll } = useSageMathParallel();
  const [rawInput, setRawInput] = useState('');
  const [jobs, setJobs] = useState<MagicJob[]>([]);
  const [running, setRunning] = useState(false);

  if (viewMode !== 'magic') return null;

  const handleCrack = async () => {
    setRunning(true);
    setJobs([]);
    setOutputResult(null);
    setOutputError(null);

    const params = detectParams(rawInput);
    const detectedFmt = detectFormat(rawInput.trim());

    if (detectedFmt === 'hex' && !params.n) {
      params.n = rawInput.trim().replace(/^0x/, '').replace(/\s/g, '');
    } else if (detectedFmt === 'decimal' && !params.n) {
      params.n = rawInput.trim();
    }

    const applicable = attacks.filter(a => a.applicableCheck(params));

    const initialJobs: MagicJob[] = applicable.map(a => ({
      attackId: a.id,
      attackName: a.name,
      status: 'running',
    }));
    setJobs(initialJobs);

    const codes = applicable.map(a => a.sageTemplate(params));

    try {
      const results = await executeAll(codes, 3);

      const updatedJobs = results.map((r, i) => ({
        ...initialJobs[i],
        status: (r.success ? 'success' : 'error') as 'success' | 'error',
        result: r.stdout,
        error: r.error,
      }));

      setJobs(updatedJobs);

      const firstSuccess = updatedJobs.find(j => j.status === 'success');
      if (firstSuccess) {
        setOutputResult(firstSuccess.result || '');
        addToHistory(firstSuccess.attackId, firstSuccess.attackName, firstSuccess.result || '', true);
      }
    } catch (err: any) {
      setOutputError(err.message || 'Magic cracker failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h2" sx={{ color: draculaColors.purple, mb: 1 }}>
            🪄 Magic Cracker
          </Typography>
          <Typography variant="body2" sx={{ color: draculaColors.comment, mb: 3 }}>
            Paste everything you have — we'll figure out which attacks to try
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

          <Button
            fullWidth
            variant="contained"
            onClick={handleCrack}
            disabled={running || !rawInput.trim()}
            sx={{
              mt: 2,
              backgroundColor: draculaColors.purple,
              fontFamily: "'JetBrainsMono Nerd Font', monospace",
              '&:hover': { backgroundColor: '#a575f6' },
              '&:disabled': { backgroundColor: draculaColors.comment },
            }}
          >
            {running ? <CircularProgress size={24} sx={{ color: draculaColors.foreground }} /> : '🔮 Crack It'}
          </Button>

          {running && (
            <Typography variant="body2" sx={{ color: draculaColors.comment, mt: 1, textAlign: 'center' }}>
              Trying {jobs.length} attacks in parallel...
            </Typography>
          )}

          {jobs.length > 0 && (
            <>
              <Divider sx={{ borderColor: draculaColors.comment, my: 2 }} />
              <List dense>
                {jobs.map(job => (
                  <ListItem key={job.attackId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Typography sx={{
                          fontFamily: "'JetBrainsMono Nerd Font', monospace",
                          fontSize: '0.8rem',
                          color: job.status === 'success' ? draculaColors.green : job.status === 'error' ? draculaColors.red : draculaColors.orange,
                        }}>
                          {job.status === 'success' ? '✅' : job.status === 'error' ? '❌' : '⏳'} {job.attackName}
                        </Typography>
                      }
                      secondary={job.error && (
                        <Typography sx={{ color: draculaColors.comment, fontSize: '0.7rem', fontFamily: "'JetBrainsMono Nerd Font', monospace" }}>
                          {job.error}
                        </Typography>
                      )}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
