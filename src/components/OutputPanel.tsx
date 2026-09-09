import { useState, useEffect, useCallback, useMemo } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { CodeBlock } from '@astryxdesign/core/CodeBlock';
import { dracula } from '@astryxdesign/core/theme/syntax';
import { History } from 'lucide-react';
import type { HistoryEntry } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useDragResize } from '../hooks/useDragResize';
import { EmptyState } from './_shared/EmptyState';

// Dracula brand tokens (verbatim kit names — never raw hex).
const c = {
  green: 'var(--dracula-green)',
  red: 'var(--dracula-red)',
  purple: 'var(--dracula-purple)',
  cyan: 'var(--dracula-cyan)',
  currentLine: 'var(--dracula-current-line)',
};

function HistoryListItem({ entry, isSelected, onClick }: { entry: HistoryEntry; isSelected: boolean; onClick: () => void }) {
  return (
    <ListItem
      isSelected={isSelected}
      onClick={onClick}
      startContent={<Icon icon={entry.success ? 'success' : 'error'} color={entry.success ? 'success' : 'error'} size="sm" />}
      label={
        <Text type="body" style={{ color: entry.success ? c.green : c.red }}>
          {entry.attackName}
        </Text>
      }
      description={
        <Text type="supporting" hasTabularNumbers>
          Preview · {entry.timestamp.toLocaleTimeString()}
        </Text>
      }
    />
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
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      setMaxOutputWidth(getMaxOutputWidth());
      setIsNarrow(window.innerWidth <= 600);
    };
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

  const [handleHover, setHandleHover] = useState(false);

  return (
    <Stack
      direction="vertical"
      isScrollable
      style={isNarrow ? { width: '100%' } : { width: outputWidth, flexShrink: 0, minHeight: 0, position: 'relative' }}
    >
      {!isNarrow && (
        <Stack
          direction="horizontal"
          hAlign="end"
          vAlign="stretch"
          onMouseDown={handleMouseDown}
          onMouseEnter={() => setHandleHover(true)}
          onMouseLeave={() => setHandleHover(false)}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '0.375rem',
            cursor: 'col-resize',
            zIndex: 10,
          }}
        >
          <Stack direction="vertical" style={{ width: '0.0625rem', height: '100%', backgroundColor: handleHover ? c.purple : c.currentLine }} />
        </Stack>
      )}

      <Stack direction="vertical" gap={2} padding={4} isScrollable style={isNarrow ? {} : { flex: 1, minHeight: 0, paddingLeft: 'var(--space-gap)' }}>
        <Heading level={3} color="accent">
          Results
        </Heading>

        {ui.historySelectedKey && (
          <Stack direction="horizontal" gap={1} vAlign="center">
            <Icon icon={History} size="sm" color="accent" />
            <Text type="body" style={{ color: c.cyan }}>
              Preview: {history.find(h => h.id === ui.historySelectedKey)?.attackName ?? ''}
            </Text>
            <Button
              label="Back"
              size="sm"
              variant="ghost"
              onClick={() => { setUi(prev => ({ ...prev, historySelectedKey: null })); }}
              icon={<Icon icon="chevronLeft" size="sm" />}
            />
          </Stack>
        )}

        {displayResult && (
          <>
            <CodeBlock
              code={displayResult}
              language="plaintext"
              syntaxTheme={dracula}
              width="100%"
              isWrapped
              maxHeight="50vh"
              data-testid="output-result"
              aria-describedby={ui.historySelectedKey ? 'history-preview-guidance' : undefined}
            />

            {ui.historySelectedKey && (
              <Text id="history-preview-guidance" type="body" color="secondary">
                Preview only. Select original inputs and rerun this attack to view complete output.
              </Text>
            )}
            <Stack direction="horizontal" gap={1} vAlign="center">
              <IconButton
                label="Copy result"
                tooltip="Copy result"
                variant="ghost"
                size="sm"
                onClick={() => { void handleCopy(); }}
                icon={<Icon icon="copy" size="sm" />}
              />
              {copied && (
                <Text type="body" aria-live="polite" style={{ color: c.green }}>
                  Copied to clipboard!
                </Text>
              )}
            </Stack>
          </>
        )}

        {outputError && (
          <Text type="code" data-testid="output-error" style={{ color: c.red, whiteSpace: 'pre-wrap' }}>
            {outputError}
          </Text>
        )}

        {!displayResult && !outputError && !ui.historySelectedKey && (
          <EmptyState title="Run an attack to see results here" />
        )}
      </Stack>

      <Stack direction="vertical" padding={4} paddingBlockStart={0}>
        <Button
          label={`History (${history.length})`}
          variant="ghost"
          width="100%"
          onClick={() => setUi(prev => ({ ...prev, historyOpen: !prev.historyOpen }))}
          endContent={<Icon icon={ui.historyOpen ? 'arrowUp' : 'chevronDown'} size="sm" />}
        />

        {ui.historyOpen && (
          <>
            <List density="compact">
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
            <Stack direction="horizontal" hAlign="center">
              <Button
                label="Clear All"
                size="sm"
                variant="destructive"
                onClick={() => setUi(prev => ({ ...prev, confirmOpen: true }))}
                isDisabled={history.length === 0}
              />
            </Stack>
          </>
        )}
      </Stack>

      <Dialog
        isOpen={ui.confirmOpen}
        onOpenChange={(open) => setUi(prev => ({ ...prev, confirmOpen: open }))}
      >
        <DialogHeader
          title="Clear History?"
          onOpenChange={(open) => setUi(prev => ({ ...prev, confirmOpen: open }))}
        />
        <Stack direction="vertical" gap={2} padding={3}>
          <Text type="body" color="secondary" hasTabularNumbers>
            This will permanently delete all {history.length} history entries.
          </Text>
          <Stack direction="horizontal" gap={1} hAlign="end">
            <Button
              label="Cancel"
              variant="ghost"
              onClick={() => setUi(prev => ({ ...prev, confirmOpen: false }))}
            />
            <Button
              label="Clear All"
              variant="destructive"
              onClick={() => {
                clearHistory();
                setUi(prev => ({ ...prev, confirmOpen: false, historySelectedKey: null }));
              }}
            />
          </Stack>
        </Stack>
      </Dialog>
    </Stack>
  );
}
