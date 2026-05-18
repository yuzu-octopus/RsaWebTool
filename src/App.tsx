import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { draculaTheme } from './theme/dracula';
import { Sidebar, drawerWidth } from './components/Sidebar';
import { AppProvider } from './context/AppContext';
import { InputPanel } from './components/InputPanel';
import { OutputPanel } from './components/OutputPanel';
import { MagicPanel } from './components/MagicPanel';
import { ProofIndex } from './components/ProofIndex';
import './styles/global.css';

function App() {
  return (
    <ThemeProvider theme={draculaTheme}>
      <CssBaseline />
      <AppProvider>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          <Sidebar />
          <Box sx={{ flex: 1, display: 'flex', minWidth: 0, marginLeft: `${drawerWidth}px` }}>
            <MagicPanel />
            <ProofIndex />
            <InputPanel />
            <OutputPanel />
          </Box>
        </Box>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
