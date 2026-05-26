import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { SwapHoriz } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { convertFormat } from '../utils/converters';
import type { Format } from '../utils/converters';
import { inputSx } from '../styles/inputSx';

const FORMATS: { value: Format; label: string }[] = [
  { value: 'hex', label: 'Hex' },
  { value: 'dec', label: 'Decimal' },
  { value: 'base64', label: 'Base64' },
  { value: 'text', label: 'Text' },
];

const selectSx = {
  mb: 1,
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
  '& .MuiSvgIcon-root': {
    color: draculaColors.foreground,
  },
};

const readOnlySx = {
  ...inputSx,
  '& .MuiInputBase-root': {
    backgroundColor: draculaColors.background,
    color: draculaColors.foreground,
    fontFamily: "'JetBrains Mono', monospace",
    '& fieldset': { borderColor: draculaColors.comment },
  },
};

export function FormatConverter() {
  const { viewMode } = useAppContext();
  const [inputText, setInputText] = useState('');
  const [inputFormat, setInputFormat] = useState<Format>('hex');
  const [outputFormat, setOutputFormat] = useState<Format>('text');

  const outputText = useMemo(() => {
    if (!inputText.trim()) return '';
    try {
      return convertFormat(inputText, inputFormat, outputFormat);
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : 'Conversion failed'}`;
    }
  }, [inputText, inputFormat, outputFormat]);

  if (viewMode !== 'format-converter') return null;

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ p: 2, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography
            variant="h2"
            sx={{ color: draculaColors.purple, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <SwapHoriz sx={{ fontSize: 'inherit' }} /> Format Converter
          </Typography>

          <Typography variant="body2" sx={{ color: draculaColors.comment, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', mb: 3 }}>
            Convert between Hex, Decimal, Base64, and Text
          </Typography>

          <FormControl fullWidth size="small" sx={selectSx}>
            <InputLabel id="input-format-label">Input Format</InputLabel>
            <Select
              labelId="input-format-label"
              value={inputFormat}
              label="Input Format"
              onChange={(e) => setInputFormat(e.target.value)}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      backgroundColor: draculaColors.background,
                    },
                  },
                },
              }}
            >
              {FORMATS.map((f) => (
                <MenuItem
                  key={f.value}
                  value={f.value}
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: draculaColors.foreground,
                    '&:hover': { backgroundColor: draculaColors.currentLine },
                    '&.Mui-selected': { backgroundColor: draculaColors.comment, '&:hover': { backgroundColor: draculaColors.comment } },
                  }}
                >
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste input here..."
            variant="outlined"
            sx={{ ...inputSx, mb: 2 }}
          />

          <FormControl fullWidth size="small" sx={selectSx}>
            <InputLabel id="output-format-label">Output Format</InputLabel>
            <Select
              labelId="output-format-label"
              value={outputFormat}
              label="Output Format"
              onChange={(e) => setOutputFormat(e.target.value)}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      backgroundColor: draculaColors.background,
                    },
                  },
                },
              }}
            >
              {FORMATS.map((f) => (
                <MenuItem
                  key={f.value}
                  value={f.value}
                  sx={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: draculaColors.foreground,
                    '&:hover': { backgroundColor: draculaColors.currentLine },
                    '&.Mui-selected': { backgroundColor: draculaColors.comment, '&:hover': { backgroundColor: draculaColors.comment } },
                  }}
                >
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={6}
            value={outputText}
            variant="outlined"
            placeholder="Output appears here..."
            slotProps={{ input: { readOnly: true } }}
            sx={readOnlySx}
          />
        </Box>
      </Box>
    </Box>
  );
}
