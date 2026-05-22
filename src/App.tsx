import { useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, Snackbar } from '@mui/material';
import { draculaTheme, draculaColors } from './theme/dracula';
import { Sidebar } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { MagicPanel } from './components/MagicPanel';
import { ProofIndex } from './components/ProofIndex';
import { RsaCalculator } from './components/RsaCalculator';
import { setFactorDBProxy } from './utils/factordb';
import { FACTORDB_PROXY_URL } from './config';
import { useAppContext } from './hooks/useAppContext';

function AppContent() {
  const { notification, showNotification } = useAppContext();

  return (
    <>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <Box sx={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
          <Box sx={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
            <InputPanel />
            <MagicPanel />
            <ProofIndex />
            <RsaCalculator />
          </Box>
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
              backgroundColor: draculaColors.currentLine,
              color: draculaColors.foreground,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.8rem',
            },
          },
        }}
      />
    </>
  );
}

function App() {
  useEffect(() => {
    if (FACTORDB_PROXY_URL) {
      setFactorDBProxy(FACTORDB_PROXY_URL);
    }
  }, []);

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
