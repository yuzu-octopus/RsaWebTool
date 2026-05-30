import { draculaColors } from '../theme/dracula';

export const FONT_FAMILY = "'JetBrains Mono', monospace" as const;

/**
 * Custom Dracula syntax theme for react-syntax-highlighter (Prism).
 * Based on the official Dracula spec: https://spec.draculatheme.com/
 */
export const draculaSourceTheme: Record<string, React.CSSProperties> = {
  'code[class*="language-"]': {
    color: draculaColors.foreground,
    background: 'none',
    fontFamily: FONT_FAMILY,
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: draculaColors.foreground,
    background: draculaColors.background,
    fontFamily: FONT_FAMILY,
    textAlign: 'left',
    whiteSpace: 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: 4,
    hyphens: 'none',
    padding: '1em',
    margin: '0',
    overflow: 'auto',
    borderRadius: '0',
  },
  ':not(pre) > code[class*="language-"]': {
    background: draculaColors.background,
    padding: '.1em',
    borderRadius: '.3em',
    whiteSpace: 'normal',
  },
  comment: { color: draculaColors.comment },
  prolog: { color: draculaColors.comment },
  doctype: { color: draculaColors.comment },
  cdata: { color: draculaColors.comment },
  punctuation: { color: draculaColors.foreground },
  namespace: { opacity: '.7' },
  property: { color: draculaColors.pink },
  tag: { color: draculaColors.pink },
  boolean: { color: draculaColors.purple },
  number: { color: draculaColors.purple },
  constant: { color: draculaColors.purple },
  symbol: { color: draculaColors.purple },
  selector: { color: draculaColors.green },
  'attr-name': { color: draculaColors.yellow },
  string: { color: draculaColors.green },
  char: { color: draculaColors.green },
  builtin: { color: draculaColors.green },
  inserted: { color: draculaColors.green },
  operator: { color: draculaColors.purple },
  entity: { color: draculaColors.foreground, cursor: 'help' },
  url: { color: draculaColors.foreground },
  '.language-css .token.string': { color: draculaColors.foreground },
  '.style .token.string': { color: draculaColors.foreground },
  variable: { color: draculaColors.foreground },
  atrule: { color: draculaColors.yellow },
  'attr-value': { color: draculaColors.yellow },
  function: { color: draculaColors.cyan },
  'class-name': { color: draculaColors.cyan },
  keyword: { color: draculaColors.pink },
  regex: { color: draculaColors.orange },
  important: { color: draculaColors.orange, fontWeight: 'bold' },
  bold: { fontWeight: 'bold' },
  italic: { fontStyle: 'italic' },
  deleted: { color: draculaColors.red },
};

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
