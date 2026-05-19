import { useState, useRef, useCallback } from 'react';
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
import { ExpandLess, ExpandMore, ContentCopy, CheckCircle, Cancel } from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula as draculaStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../context/AppContext';
import { hexToBytes, hexToAscii, decToHex, decToAscii, base64ToText } from '../utils/converters';

const utilBtnSx = {
  borderColor: draculaColors.purple,
  color: draculaColors.purple,
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.7rem',
  '&:hover': { backgroundColor: draculaColors.purple, color: draculaColors.background },
};

const MIN_WIDTH = 200;
const MAX_WIDTH = 600;

export function OutputPanel({ width, onWidthChange }: { width: number; onWidthChange: (w: number) => void }) {
  const { outputResult, outputError, history } = useAppContext();
  const [conversionResult, setConversionResult] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [notepadHeight, setNotepadHeight] = useState(() => {
    try {
      const h = localStorage.getItem('notepadHeight');
      if (h) { const n = parseInt(h, 10); if (n >= 80 && n <= 200) return n; }
    } catch { /* ignore */ }
    return 80;
  });
  const [notepadText, setNotepadText] = useState(() => {
    try {
      const stored = localStorage.getItem('notepad');
      if (stored) {
        const { text, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < 3600000) return text;
      }
    } catch { /* ignore */ }
    return '';
  });
  const isDragging = useRef(false);
  const isNotepadDragging = useRef(false);

  const handleNotepadResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isNotepadDragging.current = true;
    const startY = e.clientY;
    const startHeight = notepadHeight;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isNotepadDragging.current) return;
      const delta = ev.clientY - startY;
      const newHeight = Math.min(200, Math.max(80, startHeight - delta));
      setNotepadHeight(newHeight);
      try { localStorage.setItem('notepadHeight', String(newHeight)); } catch { /* ignore */ }
    };

    const handleMouseUp = () => {
      isNotepadDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [notepadHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startX - ev.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [width, onWidthChange]);

  const handleConvert = (fn: (s: string) => string) => {
    if (outputResult) {
      setConversionResult(fn(outputResult));
    }
  };

  const handleCopy = () => {
    if (outputResult) {
      navigator.clipboard.writeText(outputResult);
      const prevResult = conversionResult;
      setConversionResult('Copied to clipboard!');
      setTimeout(() => setConversionResult(prevResult), 2000);
    }
  };

  const handleNotepadChange = (text: string) => {
    setNotepadText(text);
    try {
      localStorage.setItem('notepad', JSON.stringify({ text, timestamp: Date.now() }));
    } catch { /* ignore */ }
  };

  return (
    <Box sx={{ width, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', pl: 2, position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'col-resize',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          '&::after': {
            content: '""',
            display: 'block',
            width: '1px',
            height: '100%',
            backgroundColor: draculaColors.comment,
            transition: 'background-color 0.15s',
          },
          '&:hover::after, &.active::after': { backgroundColor: draculaColors.purple },
        }}
        onMouseDown={handleMouseDown}
      />

      <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
        <Typography variant="h6" sx={{ color: draculaColors.purple, mb: 2, fontWeight: 700 }}>
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
                style={draculaStyle as NonNullable<SyntaxHighlighterProps['style']>}
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
              <Button size="small" variant="outlined" onClick={() => handleConvert(decToAscii)} sx={utilBtnSx}>
                Dec→ASCII
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
                fontFamily: "'JetBrains Mono', monospace",
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
          <Typography sx={{ color: draculaColors.red, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {outputError}
          </Typography>
        )}

        {!outputResult && !outputError && (
          <Typography variant="body1" sx={{ color: draculaColors.comment, fontStyle: 'italic' }}>
            Run an attack to see results here
          </Typography>
        )}
      </Box>

      <Box
        onMouseDown={handleNotepadResizeMouseDown}
        sx={{
          height: '4px',
          cursor: 'row-resize',
          display: 'flex',
          alignItems: 'center',
          '&::after': {
            content: '""',
            display: 'block',
            width: '100%',
            height: '1px',
            backgroundColor: draculaColors.comment,
            transition: 'background-color 0.15s',
          },
          '&:hover::after': { backgroundColor: draculaColors.purple },
        }}
      />

      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          onClick={() => setNotepadOpen(!notepadOpen)}
          sx={{ color: draculaColors.comment, fontFamily: "'JetBrains Mono', monospace", justifyContent: 'space-between' }}
          endIcon={notepadOpen ? <ExpandLess /> : <ExpandMore />}
        >
          Notepad
        </Button>

        <Collapse in={notepadOpen}>
          <textarea
            value={notepadText}
            onChange={e => handleNotepadChange(e.target.value)}
            placeholder="Take notes here..."
            style={{
              width: '100%',
              height: `${notepadHeight}px`,
              resize: 'none',
              marginTop: '8px',
              padding: '8px 12px',
              backgroundColor: draculaColors.currentLine,
              color: draculaColors.foreground,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.8rem',
              border: `1px solid ${draculaColors.comment}`,
              borderRadius: '4px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = draculaColors.purple)}
            onBlur={e => (e.target.style.borderColor = draculaColors.comment)}
          />
        </Collapse>
      </Box>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          onClick={() => setHistoryOpen(!historyOpen)}
          sx={{ color: draculaColors.comment, fontFamily: "'JetBrains Mono', monospace", justifyContent: 'space-between' }}
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
                    <Typography sx={{ display: 'flex', alignItems: 'center', color: entry.success ? draculaColors.green : draculaColors.red, fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace" }}>
                      {entry.success ? <CheckCircle sx={{ fontSize: '1rem', mr: 0.5 }} /> : <Cancel sx={{ fontSize: '1rem', mr: 0.5 }} />} {entry.attackName}
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
