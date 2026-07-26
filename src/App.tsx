import { useEffect, lazy, Suspense, useState } from 'react';
import { ThemeProvider, CssBaseline, Box, Snackbar, Button, IconButton } from '@mui/material';
import { draculaTheme, draculaColors } from './theme/dracula';
import { Sidebar } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { Calculator } from './components/calculator/Calculator';
const MagicPanel = lazy(() => import('./components/MagicPanel'));
const ProofIndex = lazy(() => import('./components/ProofIndex'));
const FormatConverter = lazy(() => import('./components/FormatConverter'));
const InstructionsPanel = lazy(() => import('./components/InstructionsPanel'));
const PemDecryptor = lazy(() => import('./components/PemDecryptor'));
import { ErrorBoundary } from './components/ErrorBoundary';
import { CommandPalette } from './components/CommandPalette';
import { flexPanelSx, MONO_FAMILY } from './styles/shared';
import { setFactorDBProxy } from './utils/factordb';
import env from './config/env';
import { useAppContext } from './hooks/useAppContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Menu, Search } from '@mui/icons-material';

const severityBorder: Record<string, string> = {
  success: draculaColors.green,
  error: draculaColors.red,
  info: draculaColors.cyan,
};

function AppContent() {
  const { notification, showNotification, setCommandPaletteOpen } = useAppContext();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const borderColor = notification?.severity ? severityBorder[notification.severity] : draculaColors.currentLine;

  useEffect(() => {
    if (env.factordbProxyUrl) {
      setFactorDBProxy(env.factordbProxyUrl);
    }
  }, []);

  useKeyboardShortcuts();

  return (
    <>
      <Box
        component="a"
        href="#main-workspace"
        sx={{ position: 'fixed', top: -48, left: 8, zIndex: theme => theme.zIndex.modal + 1, px: 2, py: 1, color: draculaColors.background, backgroundColor: draculaColors.cyan, fontFamily: MONO_FAMILY, '&:focus': { top: 8 } }}
      >
        Skip navigation
      </Box>
      <CommandPalette />
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: '100vh' }}>
        <Box component="header" sx={{ display: { xs: 'flex', sm: 'none' }, height: 56, minHeight: 56, alignItems: 'center', justifyContent: 'space-between', px: 1, backgroundColor: draculaColors.currentLine, borderBottom: `1px solid ${draculaColors.comment}` }}>
          <IconButton aria-label="Open navigation" onClick={() => setMobileNavigationOpen(true)} sx={{ color: draculaColors.cyan }}>
            <Menu />
          </IconButton>
          <Button startIcon={<Search />} onClick={() => setCommandPaletteOpen(true)} sx={{ color: draculaColors.foreground, fontFamily: MONO_FAMILY }}>
            Search commands
          </Button>
        </Box>
        <Sidebar mobileOpen={mobileNavigationOpen} onMobileClose={() => setMobileNavigationOpen(false)} />
        <Box component="main" id="main-workspace" tabIndex={-1} sx={{ ...flexPanelSx, outline: 'none' }}>
          <ErrorBoundary>
            <Box sx={flexPanelSx}>
              <InputPanel />
              <Calculator />
              <Suspense fallback={null}>
                <MagicPanel />
                <ProofIndex />
                <FormatConverter />
                <InstructionsPanel />
                <PemDecryptor />
              </Suspense>
            </Box>
          </ErrorBoundary>
          <ErrorBoundary>
            <OutputPanel />
          </ErrorBoundary>
        </Box>
      </Box>
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => showNotification('')}
        message={notification?.message ?? ''}
        key={notification?.key}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        slotProps={{
          content: {
            sx: {
              backgroundColor: draculaColors.background,
              border: `2px solid ${borderColor}`,
              borderRadius: '4px',
              color: draculaColors.foreground,
              fontFamily: MONO_FAMILY,
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
