import { useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { draculaColors } from '../../../theme/dracula';
import { outputBoxSx, MONO_FAMILY } from '../../../styles/shared';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';

export type ResultBoxVariant = 'compact' | 'medium' | 'tall' | 'default';

export interface ResultBoxProps {
  /** The text to display in the output box. */
  value: string;
  /** Label shown above the box (defaults to "Output"). */
  label?: string;
  /** Color of the label (defaults to dracula green for "success"). */
  labelColor?: string;
  /** Height variant. `default` uses `outputBoxSx` (150px). */
  variant?: ResultBoxVariant;
  /** Override maxHeight (string or number). When set, takes precedence over `variant`. */
  maxHeight?: string | number;
  /** Whether to show the copy button (defaults to true). */
  showCopy?: boolean;
}

/**
 * Standard output display with optional copy-to-clipboard.
 * Replaces the 6x-duplicated label + copy button + output box pattern.
 *
 * Uses `useCopyToClipboard` internally, so the copy button automatically
 * gets a "Copied!" feedback (default 2s reset).
 */
export function ResultBox({
  value,
  label = 'Output',
  labelColor,
  variant = 'default',
  maxHeight,
  showCopy = true,
}: ResultBoxProps) {
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = useCallback(() => {
    void copy(value);
  }, [copy, value]);

  // Pick the base sx by variant, then override maxHeight if provided.
  const baseSx =
    variant === 'compact' ? outputBoxSx('200px')
    : variant === 'medium' ? outputBoxSx('300px')
    : variant === 'tall' ? outputBoxSx('50vh')
    : outputBoxSx();

  const sx = maxHeight !== undefined ? { ...baseSx, maxHeight } : baseSx;

  return (
    <Box>
      {(label || showCopy) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: labelColor ?? draculaColors.green }}>
            {label}
            {copied && showCopy && (
              <Box
                component="span"
                role="status"
                aria-live="polite"
                aria-atomic="true"
                sx={{ ml: 1, color: draculaColors.cyan, fontSize: '0.65rem' }}
              >
                Copied!
              </Box>
            )}
          </Typography>
          {showCopy && (
            <Tooltip title={`Copy ${label}`}>
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{ color: draculaColors.cyan, minWidth: 44, minHeight: 44, p: 1 }}
                aria-label={`Copy ${label}`}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
      <Box sx={sx} role="status" aria-live="polite" aria-atomic="true">
        <Box
          sx={{
            fontFamily: MONO_FAMILY,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {value}
        </Box>
      </Box>
    </Box>
  );
}
