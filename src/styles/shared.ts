import { draculaColors } from '../theme/dracula';

export const FONT_FAMILY = "'JetBrains Mono', monospace" as const;

/**
 * Shared MUI sx style objects for consistent layout and theming across components.
 */
export const flexPanelSx = {
  flex: 1,
  display: 'flex',
  minWidth: 0,
  overflow: 'hidden',
} as const;

export const colFlexSx = {
  ...flexPanelSx,
  flexDirection: 'column' as const,
};

export const centeredPanelSx = {
  flex: 1,
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
};

export const outputBoxSx = {
  mt: 2,
  p: 1,
  borderRadius: 1,
  backgroundColor: draculaColors.currentLine,
  border: `1px solid ${draculaColors.purple}`,
  fontFamily: FONT_FAMILY,
  fontSize: '0.8rem',
  color: draculaColors.foreground,
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-all' as const,
  maxHeight: '150px',
  overflow: 'auto',
};

export const tabSx = {
  color: draculaColors.comment,
  fontFamily: FONT_FAMILY,
  fontSize: '0.85rem',
  minHeight: 40,
  '&.Mui-selected': {
    color: draculaColors.foreground,
  },
};

export const ghostBtnSx = {
  borderColor: draculaColors.purple,
  color: draculaColors.purple,
  fontFamily: FONT_FAMILY,
  fontSize: '0.7rem',
  '&:hover': { backgroundColor: draculaColors.purple, color: draculaColors.background },
} as const;

export function colorGhostBtn(color: string) {
  return {
    borderColor: color,
    color,
    fontFamily: FONT_FAMILY,
    fontSize: '0.8rem',
    '&:hover': { backgroundColor: color, color: draculaColors.background },
  } as const;
}
