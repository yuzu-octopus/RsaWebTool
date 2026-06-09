import { useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, Snackbar } from '@mui/material';
import { draculaTheme, draculaColors } from './theme/dracula';
import { Sidebar } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { MagicPanel } from './components/MagicPanel';
import { ProofIndex } from './components/ProofIndex';
import { Calculator } from './components/calculator/Calculator';
import { FormatConverter } from './components/FormatConverter';
import { InstructionsPanel } from './components/InstructionsPanel';
import { PemDecryptor } from './components/PemDecryptor';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { flexPanelSx, FONT_FAMILY } from './styles/shared';
import { setFactorDBProxy } from './utils/factordb';
import env from './config/env';
import { useAppContext } from './hooks/useAppContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const severityBorder: Record<string, string> = {
  success: draculaColors.green,
  error: draculaColors.red,
  info: draculaColors.cyan,
};

function AppContent() {
  const { notification, showNotification } = useAppContext();
  const borderColor = notification?.severity ? severityBorder[notification.severity] : draculaColors.currentLine;

  useEffect(() => {
    if (env.factordbProxyUrl) {
      setFactorDBProxy(env.factordbProxyUrl);
    }
  }, []);

  useKeyboardShortcuts();

  return (
    <>
      <CommandPalette />
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <Box sx={flexPanelSx}>
          <ErrorBoundary>
            <Box sx={flexPanelSx}>
              <InputPanel />
              <MagicPanel />
              <ProofIndex />
              <Calculator />
              <FormatConverter />
              <InstructionsPanel />
              <PemDecryptor />
            </Box>
          </ErrorBoundary>
          <OutputPanel />
        </Box>
      </Box>
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => showNotification('')}
        message={notification?.message ?? ''}
        key={notification?.key}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          content: {
            sx: {
              backgroundColor: draculaColors.background,
              border: `2px solid ${borderColor}`,
              borderRadius: '4px',
              color: draculaColors.foreground,
              fontFamily: FONT_FAMILY,
              fontSize: '0.8rem',
            },
          },
        }}
      />
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={draculaTheme}>
      <CssBaseline />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
