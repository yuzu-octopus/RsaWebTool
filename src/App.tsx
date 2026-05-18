import { useEffect, useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { draculaTheme } from './theme/dracula';
import { Sidebar } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { MagicPanel } from './components/MagicPanel';
import { ProofIndex } from './components/ProofIndex';
import { RsaCalculator } from './components/RsaCalculator';
import { setFactorDBProxy } from './utils/factordb';
import { FACTORDB_PROXY_URL } from './config';

function getStoredWidth(): number {
  try {
    const w = localStorage.getItem('outputPanelWidth');
    if (w) { const n = parseInt(w, 10); if (n >= 200 && n <= 600) return n; }
  } catch { /* ignore */ }
  return 300;
}

function App() {
  const [outputWidth, setOutputWidth] = useState(getStoredWidth);

  const handleWidthChange = useCallback((w: number) => {
    setOutputWidth(w);
    try { localStorage.setItem('outputPanelWidth', String(w)); } catch { /* ignore */ }
  }, []);

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
              <RsaCalculator />
            </Box>
            <OutputPanel width={outputWidth} onWidthChange={handleWidthChange} />
          </Box>
        </Box>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
