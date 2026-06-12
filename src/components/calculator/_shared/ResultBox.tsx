import { useCallback } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { draculaColors } from '../../../theme/dracula';
import {
  compactOutputSx,
  mediumOutputSx,
  outputBoxSx,
  tallOutputSx,
  MONO_FAMILY,
} from '../../../styles/shared';
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
    variant === 'compact' ? compactOutputSx
    : variant === 'medium' ? mediumOutputSx
    : variant === 'tall' ? tallOutputSx
    : outputBoxSx;

  const sx = maxHeight !== undefined ? { ...baseSx, maxHeight } : baseSx;

  return (
    <Box>
      {(label || showCopy) && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: labelColor ?? draculaColors.green }}>
            {label}
            {copied && showCopy && (
              <Box component="span" sx={{ ml: 1, color: draculaColors.cyan, fontSize: '0.65rem' }}>
                Copied!
              </Box>
            )}
          </Typography>
          {showCopy && (
            <Tooltip title="Copy to clipboard">
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{ color: draculaColors.cyan, p: 0.25 }}
                aria-label="Copy to clipboard"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
      <Box sx={sx}>
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
