import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import { ExpandLess, ExpandMore, ContentCopy } from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula as draculaStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../context/AppContext';
import { hexToBytes, hexToAscii, decToHex, decToBytes, base64ToText } from '../utils/converters';

const utilBtnSx = {
  borderColor: draculaColors.purple,
  color: draculaColors.purple,
  fontFamily: "'JetBrainsMono Nerd Font', monospace",
  fontSize: '0.7rem',
  '&:hover': { backgroundColor: draculaColors.purple, color: draculaColors.background },
};

export function OutputPanel() {
  const { outputResult, outputError, history } = useAppContext();
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleConvert = (fn: (s: string) => string) => {
    if (outputResult) {
      setConversionResult(fn(outputResult));
    }
  };

  const handleCopy = () => {
    if (outputResult) {
      navigator.clipboard.writeText(outputResult);
      setConversionResult('Copied to clipboard!');
      setTimeout(() => setConversionResult(null), 2000);
    }
  };

  return (
    <Box sx={{ width: '40%', minWidth: 300, display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${draculaColors.comment}`, overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h3" sx={{ color: draculaColors.purple, mb: 2 }}>
          Results
        </Typography>

        {outputResult && (
          <>
            <Box sx={{
              maxHeight: '50vh',
              overflow: 'auto',
              borderRadius: 1,
              border: `1px solid ${draculaColors.comment}`,
            }}>
              <SyntaxHighlighter
                language="text"
                style={draculaStyle as any}
                customStyle={{ margin: 0, borderRadius: 'inherit', fontSize: '0.8rem' }}
              >
                {outputResult}
              </SyntaxHighlighter>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" onClick={handleCopy} sx={utilBtnSx} startIcon={<ContentCopy />}>
                Copy
              </Button>
              <Button size="small" variant="outlined" onClick={() => handleConvert(hexToBytes)} sx={utilBtnSx}>
                Hex→Bytes
              </Button>
              <Button size="small" variant="outlined" onClick={() => handleConvert(hexToAscii)} sx={utilBtnSx}>
                Hex→ASCII
              </Button>
              <Button size="small" variant="outlined" onClick={() => handleConvert(decToHex)} sx={utilBtnSx}>
                Dec→Hex
              </Button>
              <Button size="small" variant="outlined" onClick={() => handleConvert(decToBytes)} sx={utilBtnSx}>
                Dec→Bytes
              </Button>
              <Button size="small" variant="outlined" onClick={() => handleConvert(base64ToText)} sx={utilBtnSx}>
                Base64→Text
              </Button>
            </Box>

            {conversionResult && (
              <Box sx={{
                mt: 2,
                p: 1,
                borderRadius: 1,
                backgroundColor: draculaColors.currentLine,
                border: `1px solid ${draculaColors.purple}`,
                fontFamily: "'JetBrainsMono Nerd Font', monospace",
                fontSize: '0.8rem',
                color: draculaColors.foreground,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: '150px',
                overflow: 'auto',
              }}>
                {conversionResult}
              </Box>
            )}
          </>
        )}

        {outputError && (
          <Typography sx={{ color: draculaColors.red, fontFamily: "'JetBrainsMono Nerd Font', monospace", fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {outputError}
          </Typography>
        )}

        {!outputResult && !outputError && (
          <Typography variant="body1" sx={{ color: draculaColors.comment, fontStyle: 'italic' }}>
            Run an attack to see results here
          </Typography>
        )}
      </Box>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <Box sx={{ px: 2 }}>
        <Button
          fullWidth
          onClick={() => setHistoryOpen(!historyOpen)}
          sx={{ color: draculaColors.comment, fontFamily: "'JetBrainsMono Nerd Font', monospace", justifyContent: 'space-between' }}
          endIcon={historyOpen ? <ExpandLess /> : <ExpandMore />}
        >
          History ({history.length})
        </Button>

        <Collapse in={historyOpen}>
          <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
            {history.map((entry, i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Typography sx={{ color: entry.success ? draculaColors.green : draculaColors.red, fontSize: '0.75rem', fontFamily: "'JetBrainsMono Nerd Font', monospace" }}>
                      {entry.success ? '✅' : '❌'} {entry.attackName}
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{ color: draculaColors.comment, fontSize: '0.65rem' }}>
                      {entry.timestamp.toLocaleTimeString()}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Collapse>
      </Box>
    </Box>
  );
}
