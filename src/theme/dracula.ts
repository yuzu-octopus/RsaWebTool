import { createTheme } from '@mui/material/styles';

export const draculaColors = {
  background: '#282a36',
  currentLine: '#44475a',
  foreground: '#f8f8f2',
  comment: '#6272a4',
  cyan: '#8be9fd',
  green: '#50fa7b',
  orange: '#ffb86c',
  pink: '#ff79c0',
  purple: '#bd93f9',
  red: '#ff5555',
  yellow: '#f1fa8c',
};

export const draculaTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: draculaColors.background,
      paper: draculaColors.currentLine,
    },
    primary: {
      main: draculaColors.purple,
    },
    secondary: {
      main: draculaColors.pink,
    },
    text: {
      primary: draculaColors.foreground,
      secondary: draculaColors.comment,
    },
  },
  typography: {
    fontFamily: "'JetBrainsMono Nerd Font', monospace",
    h1: { fontFamily: "'JetBrainsMono Nerd Font', monospace", fontWeight: 700 },
    h2: { fontFamily: "'JetBrainsMono Nerd Font', monospace", fontWeight: 700 },
    h3: { fontFamily: "'JetBrainsMono Nerd Font', monospace", fontWeight: 700 },
    body1: { fontFamily: "'JetBrainsMono Nerd Font', monospace" },
    body2: { fontFamily: "'JetBrainsMono Nerd Font', monospace" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: draculaColors.background,
          color: draculaColors.foreground,
        },
        '::-webkit-scrollbar': { width: '8px' },
        '::-webkit-scrollbar-track': { background: draculaColors.background },
        '::-webkit-scrollbar-thumb': { background: draculaColors.currentLine, borderRadius: '4px' },
        '::-webkit-scrollbar-thumb:hover': { background: draculaColors.comment },
      },
    },
  },
});
