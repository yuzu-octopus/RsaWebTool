import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ExpandLess, ExpandMore, ContentCopy, CheckCircle, Cancel, History as HistoryIcon, ArrowBack } from '@mui/icons-material';
import type { HistoryEntry } from '../types';
import { draculaColors } from '../theme/dracula';
import { useAppContext } from '../hooks/useAppContext';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useDragResize } from '../hooks/useDragResize';
import { ghostBtnSx, MONO_FAMILY } from '../styles/shared';
import { EmptyState } from './_shared/EmptyState';

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
          <Typography sx={{ display: 'flex', alignItems: 'center', color: entry.success ? draculaColors.green : draculaColors.red, fontSize: '0.75rem', fontFamily: MONO_FAMILY }}>
            {entry.success ? <CheckCircle sx={{ fontSize: '1rem', mr: 0.5 }} /> : <Cancel sx={{ fontSize: '1rem', mr: 0.5 }} />} {entry.attackName}
          </Typography>
        }
        secondary={
          <Typography sx={{ color: draculaColors.comment, fontSize: '0.75rem' }}>
            Preview · {entry.timestamp.toLocaleTimeString()}
          </Typography>
        }
      />
    </ListItemButton>
  );
}

export function OutputPanel() {
  const { outputResult, outputError, history, clearHistory, showNotification } = useAppContext();
  const [ui, setUi] = useState({ historySelectedKey: null as string | null, historyOpen: false, confirmOpen: false });
  const { copied, copy } = useCopyToClipboard();

  const displayResult = useMemo(() => {
    if (!ui.historySelectedKey) return outputResult;
    return history.find(h => h.id === ui.historySelectedKey)?.result ?? null;
  }, [ui.historySelectedKey, history, outputResult]);

  const handleHistoryClick = useCallback((key: string) => {
    setUi(prev => ({ ...prev, historySelectedKey: key }));
  }, []);
  const getMaxOutputWidth = useCallback(() => Math.max(200, Math.min(600, window.innerWidth - 620)), []);

  const [maxOutputWidth, setMaxOutputWidth] = useState(getMaxOutputWidth);

  useEffect(() => {
    const handleResize = () => setMaxOutputWidth(getMaxOutputWidth());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getMaxOutputWidth]);

  const [width, handleMouseDown] = useDragResize({
    axis: 'x',
    min: 200,
    max: maxOutputWidth,
    defaultValue: Math.min(300, maxOutputWidth),
    storageKey: 'outputPanelWidth',
  });
  const outputWidth = Math.min(width, maxOutputWidth);

  const handleCopy = async () => {
    if (!displayResult) return;
    if (!await copy(displayResult)) showNotification('Could not copy to clipboard.', 'error');
  };

  return (
    <Box sx={{ width: outputWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', pl: 2, position: 'relative', '@media (max-width: 600px)': { width: '100%', pl: 0, overflow: 'visible', flexShrink: 1 } }}>
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '6px',
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
            backgroundColor: draculaColors.currentLine,
            transition: 'background-color 0.15s',
          },
          '&:hover::after, &.active::after': { backgroundColor: draculaColors.purple },
          '@media (max-width: 600px)': { display: 'none', pointerEvents: 'none' },
        }}
        onMouseDown={handleMouseDown}
      />

      <Box sx={{ p: 2, overflow: 'auto', flex: 1, pb: '20vh', '@media (max-width: 600px)': { overflow: 'visible', flex: 'none', pb: 2 } }}>
        <Typography variant="h5" sx={{ color: draculaColors.purple, fontWeight: 600, mb: 2, fontFamily: MONO_FAMILY }}>
          Results
        </Typography>

        {ui.historySelectedKey && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <HistoryIcon sx={{ fontSize: '1rem', color: draculaColors.cyan }} />
            <Typography sx={{ color: draculaColors.cyan, fontSize: '0.75rem', fontFamily: MONO_FAMILY, flex: 1 }}>
              Preview: {history.find(h => h.id === ui.historySelectedKey)?.attackName ?? ''}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<ArrowBack fontSize="small" />}
              onClick={() => { setUi(prev => ({ ...prev, historySelectedKey: null })); }}
              sx={{ borderColor: draculaColors.comment, color: draculaColors.comment, fontSize: '0.65rem', fontFamily: MONO_FAMILY, '&:hover': { backgroundColor: draculaColors.currentLine } }}
            >
              Back
            </Button>
          </Box>
        )}

        {displayResult && (
          <>
            <Box data-testid="output-result" aria-describedby={ui.historySelectedKey ? 'history-preview-guidance' : undefined} sx={{
              maxHeight: '50vh',
              overflow: 'auto',
              borderRadius: 1,
              border: `1px solid ${draculaColors.comment}`,
              '@media (max-width: 600px)': { maxHeight: 'none', overflow: 'visible' },
            }}>
              <Box
                component="pre"
                sx={{
                  margin: 0,
                  borderRadius: 'inherit',
                  fontSize: '0.8rem',
                  fontFamily: MONO_FAMILY,
                  backgroundColor: draculaColors.background,
                  color: draculaColors.foreground,
                  p: 1.5,
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                {displayResult}
              </Box>
            </Box>

            {ui.historySelectedKey && (
              <Typography id="history-preview-guidance" variant="caption" sx={{ display: 'block', color: draculaColors.comment, fontSize: '0.7rem', mt: 1 }}>
                Preview only. Select original inputs and rerun this attack to view complete output.
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
              <Button size="small" variant="outlined" onClick={() => { void handleCopy(); }} sx={ghostBtnSx} startIcon={<ContentCopy />}>
                Copy
              </Button>
              {copied && (
                <Typography variant="caption" aria-live="polite" sx={{ color: draculaColors.green, fontSize: '0.7rem', alignSelf: 'center' }}>
                  Copied to clipboard!
                </Typography>
              )}
            </Box>
          </>
        )}

        {outputError && (
          <Typography data-testid="output-error" sx={{ color: draculaColors.red, fontFamily: MONO_FAMILY, fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
            {outputError}
          </Typography>
        )}

        {!displayResult && !outputError && !ui.historySelectedKey && (
          <EmptyState title="Run an attack to see results here" padding={4} />
        )}
      </Box>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <Box sx={{ px: 2, pb: 2 }}>
        <Button
          fullWidth
          onClick={() => setUi(prev => ({ ...prev, historyOpen: !prev.historyOpen }))}
          sx={{ color: draculaColors.comment, fontFamily: MONO_FAMILY, justifyContent: 'space-between' }}
          endIcon={ui.historyOpen ? <ExpandLess /> : <ExpandMore />}
        >
          History ({history.length})
        </Button>

        <Collapse in={ui.historyOpen}>
          <List dense sx={{ maxHeight: '200px', overflow: 'auto', '@media (max-width: 600px)': { maxHeight: 'none', overflow: 'visible' } }}>
            {history.map((entry) => {
              const key = entry.id;
              const selected = ui.historySelectedKey === key;
              return (
                <HistoryListItem
                  key={key}
                  entry={entry}
                  isSelected={selected}
                  onClick={() => handleHistoryClick(key)}
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
                fontFamily: MONO_FAMILY,
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
        <DialogTitle sx={{ color: draculaColors.foreground, fontFamily: MONO_FAMILY }}>
          Clear History?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: draculaColors.comment, fontFamily: MONO_FAMILY }}>
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
