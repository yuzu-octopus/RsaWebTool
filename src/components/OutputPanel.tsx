import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { ExpandLess, ExpandMore, ContentCopy, CheckCircle, Cancel, History as HistoryIcon } from '@mui/icons-material';
import type { HistoryEntry } from '../types';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { useDragResize } from '../hooks/useDragResize';
import { useNotepad } from '../hooks/useNotepad';
import { ghostBtnSx, FONT_FAMILY } from '../styles/shared';

const notepadBaseStyle: React.CSSProperties = {
  width: '100%',
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
};

function HistoryListItem({ entry, isSelected, onClick }: { entry: HistoryEntry; isSelected: boolean; onClick: () => void }) {
  return (
    <ListItemButton
      selected={isSelected}
      onClick={onClick}
      sx={{
        px: 1,
        cursor: 'pointer',
        borderRadius: 1,
        border: `1px solid ${isSelected ? draculaColors.comment : 'transparent'}`,
        '&:hover': { borderColor: draculaColors.comment },
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
    </ListItemButton>
  );
}

export function OutputPanel() {
  const { outputResult, outputError, history, clearHistory } = useAppContext();
  const [ui, setUi] = useState({ copyMessage: null as string | null, historySelectedKey: null as string | null, historyOpen: false, confirmOpen: false });
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const displayResult = useMemo(() => {
    if (!ui.historySelectedKey) return outputResult;
    return history.find(h => (h.timestamp.getTime() + '-' + h.attackId) === ui.historySelectedKey)?.result ?? null;
  }, [ui.historySelectedKey, history, outputResult]);

  const handleHistoryClick = useCallback((_entry: HistoryEntry, key: string) => {
    setUi(prev => ({ ...prev, historySelectedKey: key }));
  }, []);
  const { notepadOpen, setNotepadOpen, notepadText, handleNotepadChange, notepadHeight, handleNotepadResizeMouseDown } = useNotepad();
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
      setUi(prev => ({ ...prev, copyMessage: 'Copied to clipboard!' }));
      setTimeout(() => { if (mountedRef.current) setUi(prev => ({ ...prev, copyMessage: null })); }, 2000);
    }
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

      <Box sx={{ p: 2, overflow: 'auto', flex: 1, pb: '20vh' }}>
        <Typography variant="h6" sx={{ color: draculaColors.purple, mb: 2, fontWeight: 700 }}>
          Results
        </Typography>

        {ui.historySelectedKey && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <HistoryIcon sx={{ fontSize: '1rem', color: draculaColors.cyan }} />
            <Typography sx={{ color: draculaColors.cyan, fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", flex: 1 }}>
              History: {history.find(h => (h.timestamp.getTime() + '-' + h.attackId) === ui.historySelectedKey)?.attackName ?? ''}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={() => { setUi(prev => ({ ...prev, historySelectedKey: null })); }}
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
              <Box
                component="pre"
                sx={{
                  margin: 0,
                  borderRadius: 'inherit',
                  fontSize: '0.8rem',
                  fontFamily: FONT_FAMILY,
                  backgroundColor: draculaColors.background,
                  color: draculaColors.foreground,
                  p: 1.5,
                  overflow: 'auto',
                  lineHeight: '1.5',
                  whiteSpace: 'pre',
                }}
              >
                {displayResult}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" onClick={handleCopy} sx={ghostBtnSx} startIcon={<ContentCopy />}>
                Copy
              </Button>
              {ui.copyMessage && (
                <Typography variant="caption" sx={{ color: draculaColors.green, fontSize: '0.7rem', alignSelf: 'center' }}>
                  {ui.copyMessage}
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

        {!displayResult && !outputError && !ui.historySelectedKey && (
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
            style={{ ...notepadBaseStyle, height: `${notepadHeight}px` }}
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
          onClick={() => setUi(prev => ({ ...prev, historyOpen: !prev.historyOpen }))}
          sx={{ color: draculaColors.comment, fontFamily: "'JetBrains Mono', monospace", justifyContent: 'space-between' }}
          endIcon={ui.historyOpen ? <ExpandLess /> : <ExpandMore />}
        >
          History ({history.length})
        </Button>

        <Collapse in={ui.historyOpen}>
          <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
            {history.map((entry) => {
              const key = entry.timestamp.getTime() + '-' + entry.attackId;
              const selected = ui.historySelectedKey === key;
              return (
                <HistoryListItem
                  key={key}
                  entry={entry}
                  isSelected={selected}
                  onClick={() => handleHistoryClick(entry, key)}
                />
              );
            })}
          </List>
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => setUi(prev => ({ ...prev, confirmOpen: true }))}
              disabled={history.length === 0}
              sx={{
                borderColor: draculaColors.red,
                color: draculaColors.red,
                fontSize: '0.7rem',
                fontFamily: "'JetBrains Mono', monospace",
                '&:hover': { backgroundColor: 'rgba(255,85,85,0.1)' },
                '&:disabled': { borderColor: draculaColors.comment, color: draculaColors.comment },
              }}
            >
              Clear All
            </Button>
          </Box>
        </Collapse>
      </Box>

      <Dialog
        open={ui.confirmOpen}
        onClose={() => setUi(prev => ({ ...prev, confirmOpen: false }))}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: draculaColors.background,
              border: `1px solid ${draculaColors.comment}`,
              borderRadius: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ color: draculaColors.foreground, fontFamily: "'JetBrains Mono', monospace" }}>
          Clear History?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: draculaColors.comment, fontFamily: "'JetBrains Mono', monospace" }}>
            This will permanently delete all {history.length} history entries.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setUi(prev => ({ ...prev, confirmOpen: false }))}
            sx={{ borderColor: draculaColors.comment, color: draculaColors.comment }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              clearHistory();
              setUi(prev => ({ ...prev, confirmOpen: false, historySelectedKey: null }));
            }}
            sx={{ borderColor: draculaColors.red, color: draculaColors.red }}
            variant="outlined"
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
