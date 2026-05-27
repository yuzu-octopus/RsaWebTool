import { useState, useRef, useEffect } from 'react';
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
import { ExpandLess, ExpandMore, ContentCopy, CheckCircle, Cancel, History as HistoryIcon } from '@mui/icons-material';
import type { HistoryEntry } from '../types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula as draculaStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { useDragResize } from '../hooks/useDragResize';
import { ghostBtnSx } from '../styles/shared';

export function OutputPanel() {
  const { outputResult, outputError, history } = useAppContext();
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [historyView, setHistoryView] = useState<HistoryEntry | null>(null);
  const [historySelectedKey, setHistorySelectedKey] = useState<string | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setHistoryView(null);
    setHistorySelectedKey(null);
  }, [outputResult]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const displayResult = historyView ? historyView.result : outputResult;

  const [historyOpen, setHistoryOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [notepadText, setNotepadText] = useState(() => {
    try {
      const stored = localStorage.getItem('notepad:v1') ?? localStorage.getItem('notepad');
      if (stored) {
        const { text, timestamp } = JSON.parse(stored) as { text: string; timestamp: number };
        if (Date.now() - timestamp < 3600000) return text;
      }
    } catch { /* ignore */ }
    return '';
  });
  const [notepadHeight, handleNotepadResizeMouseDown] = useDragResize({
    axis: 'y',
    min: 80,
    max: 200,
    defaultValue: 80,
    storageKey: 'notepadHeight',
  });
  const [width, handleMouseDown] = useDragResize({
    axis: 'x',
    min: 200,
    max: 600,
    defaultValue: 300,
    storageKey: 'outputPanelWidth',
  });

  const handleCopy = () => {
    if (displayResult) {
      void navigator.clipboard.writeText(displayResult);
      setCopyMessage('Copied to clipboard!');
      setTimeout(() => { if (mountedRef.current) setCopyMessage(null); }, 2000);
    }
  };

  // Debounced localStorage write for notepad (500ms)
  useEffect(() => {
    if (!notepadOpen) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem('notepad:v1', JSON.stringify({ text: notepadText, timestamp: Date.now() }));
      } catch { /* ignore */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [notepadText, notepadOpen]);

  const handleNotepadChange = (text: string) => {
    setNotepadText(text);
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

        {historyView && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <HistoryIcon sx={{ fontSize: '1rem', color: draculaColors.cyan }} />
            <Typography sx={{ color: draculaColors.cyan, fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>
              History: {historyView.attackName}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => { setHistoryView(null); setHistorySelectedKey(null); }}
              sx={{ borderColor: draculaColors.comment, color: draculaColors.comment, fontSize: '0.65rem', fontFamily: "'JetBrains Mono', monospace", '&:hover': { backgroundColor: draculaColors.currentLine }, py: 0, px: 1, minWidth: 0 }}
            >
              Back
            </Button>
          </Box>
        )}

        {displayResult && (
          <>
            <Box data-testid="output-result" sx={{
              maxHeight: '50vh',
              overflow: 'auto',
              borderRadius: 1,
              border: `1px solid ${draculaColors.comment}`,
            }}>
              <SyntaxHighlighter
                language="text"
                style={draculaStyle}
                customStyle={{ margin: 0, borderRadius: 'inherit', fontSize: '0.8rem' }}
              >
                {displayResult}
              </SyntaxHighlighter>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" onClick={handleCopy} sx={ghostBtnSx} startIcon={<ContentCopy />}>
                Copy
              </Button>
              {copyMessage && (
                <Typography variant="caption" sx={{ color: draculaColors.green, fontSize: '0.7rem', alignSelf: 'center' }}>
                  {copyMessage}
                </Typography>
              )}
            </Box>
          </>
        )}

        {outputError && (
          <Typography data-testid="output-error" sx={{ color: draculaColors.red, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {outputError}
          </Typography>
        )}

        {!displayResult && !outputError && !historyView && (
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
            aria-label="Notepad"
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
              boxShadow: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => {
              e.target.style.borderColor = draculaColors.purple;
              e.target.style.boxShadow = `0 0 0 2px ${draculaColors.purple}40`;
            }}
            onBlur={e => {
              e.target.style.borderColor = draculaColors.comment;
              e.target.style.boxShadow = 'none';
            }}
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
            {history.map((entry) => {
              const key = entry.timestamp.getTime() + '-' + entry.attackId;
              const selected = historySelectedKey === key;
              return (
                <ListItem
                  key={key}
                  sx={{
                    px: 1,
                    cursor: 'pointer',
                    borderRadius: 1,
                    border: `1px solid ${selected ? draculaColors.comment : 'transparent'}`,
                    '&:hover': { borderColor: draculaColors.comment },
                  }}
                  onClick={() => {
                    setHistoryView(entry);
                    setHistorySelectedKey(key);
                  }}
                >
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
              );
            })}
          </List>
        </Collapse>
      </Box>
    </Box>
  );
}
