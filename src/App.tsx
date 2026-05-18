import { useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { draculaTheme } from './theme/dracula';
import { Sidebar } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { MagicPanel } from './components/MagicPanel';
import { ProofIndex } from './components/ProofIndex';
import { setFactorDBProxy } from './utils/factordb';
import { FACTORDB_PROXY_URL } from './config';

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
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Sidebar />
          <Box sx={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
            <Box sx={{ flex: 1, display: 'flex', minWidth: 0, overflow: 'hidden' }}>
              <InputPanel />
              <MagicPanel />
              <ProofIndex />
            </Box>
            <OutputPanel />
          </Box>
        </Box>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
