import { useState, useEffect, useRef } from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Typography,
  Box,
  Divider,
  Link,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ExpandLess, ExpandMore, AutoFixHigh, MenuBook, SwapHoriz, CheckCircle, ErrorOutlined, VpnKey, Lock, Hub, Tag, Security, Menu } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { pulse } from '../styles/shared';
import { CATEGORIES, attacksByCategory } from '../attacks';
import { CALCULATOR_ITEMS } from '../config/sidebarItems';
import type { Attack } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import env from '../config/env';

const drawerWidth = 220;

interface ServiceStatus {
  factordb: 'checking' | 'ok' | 'error';
  sagecell: 'checking' | 'ok' | 'error';
}

const calculatorIcon = (mode: string) => {
  switch (mode) {
    case 'rsa': return <VpnKey sx={{ color: draculaColors.cyan, mr: 1, fontSize: '1.1rem' }} />;
    case 'aes': return <Lock sx={{ color: draculaColors.purple, mr: 1, fontSize: '1.1rem' }} />;
    case 'ecc': return <Hub sx={{ color: draculaColors.green, mr: 1, fontSize: '1.1rem' }} />;
    case 'hash': return <Tag sx={{ color: draculaColors.orange, mr: 1, fontSize: '1.1rem' }} />;
    case 'dh': return <Security sx={{ color: draculaColors.pink, mr: 1, fontSize: '1.1rem' }} />;
    default: return null;
  }
};

const sidebarActiveSx = {
  borderLeft: `3px solid ${draculaColors.purple}`,
  backgroundColor: draculaColors.background,
  '&:hover': { backgroundColor: draculaColors.background },
} as const;
const sidebarInactiveSx = {
  borderLeft: '3px solid transparent',
  backgroundColor: 'transparent',
  // Hover uses `background` (darker than the Drawer's `currentLine` background)
  // so the hover state is actually visible. Using `currentLine` here would
  // produce no visible change against the sidebar paper.
  '&:hover': { backgroundColor: draculaColors.background },
} as const;

export function Sidebar() {
  const { selectedAttack, setSelectedAttack, setViewMode, viewMode, calculatorMode, setCalculatorMode } = useAppContext();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set([...CATEGORIES, 'Calculators']));
  const [status, setStatus] = useState<ServiceStatus>({
    factordb: 'checking',
    sagecell: typeof window !== 'undefined' && window.sagecell ? 'ok' : 'checking',
  });
  const sageCellChecked = useRef(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    let factorDbTimeout: ReturnType<typeof setTimeout> | undefined;

    if (env.factordbProxyUrl) {
      fetch(`${env.factordbProxyUrl}?query=15`, { signal: abortController.signal })
        .then(r => r.json())
        .then(() => {
          if (factorDbTimeout) clearTimeout(factorDbTimeout);
          setStatus(prev => ({ ...prev, factordb: 'ok' }));
        })
        .catch(() => {
          if (!abortController.signal.aborted) {
            if (factorDbTimeout) clearTimeout(factorDbTimeout);
            setStatus(prev => ({ ...prev, factordb: 'error' }));
          }
        });
      factorDbTimeout = setTimeout(() => {
        if (!abortController.signal.aborted) {
          abortController.abort();
          setStatus(prev => ({ ...prev, factordb: 'error' }));
        }
      }, 5000);
    } else {
      queueMicrotask(() => setStatus(prev => ({ ...prev, factordb: 'error' })));
    }

    return () => {
      abortController.abort();
      if (factorDbTimeout) clearTimeout(factorDbTimeout);
    };
  }, []);

  useEffect(() => {
    if (sageCellChecked.current) return;

    const timer = setInterval(() => {
      if (window.sagecell) {
        clearInterval(timer);
        clearTimeout(timeout);
        sageCellChecked.current = true;
        setStatus(prev => ({ ...prev, sagecell: 'ok' }));
      }
    }, 200);
    const timeout = setTimeout(() => {
      clearInterval(timer);
      sageCellChecked.current = true;
      if (!window.sagecell) {
        setStatus(prev => ({ ...prev, sagecell: 'error' }));
      }
    }, 10000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, []);

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleAttackClick = (attack: Attack) => {
    setSelectedAttack(attack);
    setViewMode('attack');
  };

  const isAttackActive = (id: string) => viewMode === 'attack' && selectedAttack?.id === id;
  const isViewActive = (mode: string) => viewMode === mode;

  // Scroll sidebar to center the active item
  useEffect(() => {
    let el: HTMLElement | null = null;
    if (viewMode === 'attack' && selectedAttack) {
      el = document.getElementById(`sidebar-attack-${selectedAttack.id}`);
    } else if (viewMode === 'calculator') {
      el = document.getElementById(`sidebar-calc-${calculatorMode}`);
    } else if (viewMode !== 'attack') {
      el = document.getElementById(`sidebar-view-${viewMode}`);
    }
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedAttack, viewMode, calculatorMode]);

  return (
    <>
      {/* Mobile-only hamburger toggle (rendered into a portal by App.tsx normally,
          but inline here for simplicity — hidden on md+ viewports and when the
          Drawer is already open, since the Drawer's own backdrop handles close). */}
      {isMobile && !mobileOpen && (
        <IconButton
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          sx={{
            position: 'fixed',
            top: 8,
            left: 8,
            zIndex: 1300,
            color: draculaColors.purple,
            backgroundColor: draculaColors.background,
            border: `1px solid ${draculaColors.comment}`,
            '&:hover': { backgroundColor: draculaColors.currentLine },
          }}
        >
          <Menu />
        </IconButton>
      )}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: draculaColors.currentLine,
            borderRight: `1px solid ${draculaColors.comment}`,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ color: draculaColors.purple, fontWeight: 700 }}>
          RSA CTF Tool
        </Typography>
        <Typography variant="caption" sx={{ color: draculaColors.comment }}>
          SageMath Powered
        </Typography>
      </Box>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {CATEGORIES.map(cat => (
          <Box key={cat}>
            <ListItemButton onClick={() => toggleCat(cat)} sx={{ px: 2 }}>
              <Typography sx={{ color: draculaColors.cyan, fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>
                {cat}
              </Typography>
              {expandedCats.has(cat) ? <ExpandLess sx={{ color: draculaColors.comment }} /> : <ExpandMore sx={{ color: draculaColors.comment }} />}
            </ListItemButton>
            <Collapse in={expandedCats.has(cat)} unmountOnExit>
              <List component="div" disablePadding>
                {(attacksByCategory.get(cat) || []).map(attack => (
                  <ListItemButton
                    key={attack.id}
                    id={`sidebar-attack-${attack.id}`}
                    onClick={() => handleAttackClick(attack)}
                    data-testid={`attack-${attack.id}`}
                    sx={{
                      pl: 4,
                      ...(isAttackActive(attack.id) ? sidebarActiveSx : sidebarInactiveSx),
                    }}
                  >
                    <ListItemText
                      primary={attack.name}
                      slotProps={{ primary: { sx: { color: draculaColors.foreground, fontSize: '0.75rem' } } }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}

        <Box key="Calculators">
          <ListItemButton onClick={() => toggleCat('Calculators')} sx={{ px: 2 }}>
            <Typography sx={{ color: draculaColors.cyan, fontWeight: 600, fontSize: '0.85rem', flex: 1 }}>
              Calculators
            </Typography>
            {expandedCats.has('Calculators') ? <ExpandLess sx={{ color: draculaColors.comment }} /> : <ExpandMore sx={{ color: draculaColors.comment }} />}
          </ListItemButton>
          <Collapse in={expandedCats.has('Calculators')} unmountOnExit>
            <List component="div" disablePadding>
              {CALCULATOR_ITEMS.map(item => (
                <ListItemButton
                  key={item.id}
                  id={`sidebar-calc-${item.calculatorMode}`}
                  onClick={() => { setViewMode('calculator'); setCalculatorMode(item.calculatorMode); }}
                  sx={{
                    pl: 4,
                    ...(viewMode === 'calculator' && calculatorMode === item.calculatorMode ? sidebarActiveSx : sidebarInactiveSx),
                  }}
                >
                  {calculatorIcon(item.calculatorMode)}
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { sx: { color: draculaColors.foreground, fontSize: '0.85rem' } } }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </Box>

        <Divider sx={{ borderColor: draculaColors.comment, my: 1 }} />

        <ListItemButton
          id="sidebar-view-instructions"
          onClick={() => setViewMode('instructions')}
          sx={{
            pl: 4,
            ...(isViewActive('instructions') ? sidebarActiveSx : sidebarInactiveSx),
          }}
        >
          <MenuBook sx={{ color: draculaColors.green, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="Instructions"
            slotProps={{ primary: { sx: { color: draculaColors.green, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <ListItemButton
          id="sidebar-view-magic"
          onClick={() => setViewMode('magic')}
          sx={{
            pl: 4,
            ...(isViewActive('magic') ? sidebarActiveSx : sidebarInactiveSx),
          }}
        >
          <AutoFixHigh sx={{ color: draculaColors.purple, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="Magic"
            slotProps={{ primary: { sx: { color: draculaColors.purple, fontWeight: 600, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <ListItemButton
          id="sidebar-view-proofs"
          onClick={() => setViewMode('proofs')}
          sx={{
            pl: 4,
            mt: 0.5,
            ...(isViewActive('proofs') ? sidebarActiveSx : sidebarInactiveSx),
          }}
        >
          <MenuBook sx={{ color: draculaColors.foreground, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="Attack Index"
            slotProps={{ primary: { sx: { color: draculaColors.foreground, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <ListItemButton
          id="sidebar-view-format-converter"
          onClick={() => setViewMode('format-converter')}
          sx={{
            pl: 4,
            mt: 0.5,
            ...(isViewActive('format-converter') ? sidebarActiveSx : sidebarInactiveSx),
          }}
        >
          <SwapHoriz sx={{ color: draculaColors.orange, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="Converter"
            slotProps={{ primary: { sx: { color: draculaColors.orange, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <ListItemButton
          id="sidebar-view-pem"
          onClick={() => setViewMode('pem')}
          sx={{
            pl: 4,
            mt: 0.5,
            ...(isViewActive('pem') ? sidebarActiveSx : sidebarInactiveSx),
          }}
        >
          <VpnKey sx={{ color: draculaColors.yellow, mr: 1, fontSize: '1.1rem' }} />
          <ListItemText
            primary="PEM Decryptor"
            slotProps={{ primary: { sx: { color: draculaColors.yellow, fontSize: '0.85rem' } } }}
          />
        </ListItemButton>

        <Divider sx={{ borderColor: draculaColors.comment, my: 1 }} />

        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" sx={{ color: draculaColors.comment, fontWeight: 600, fontSize: '0.7rem', display: 'block', mb: 0.5 }}>
            SERVICE STATUS
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            {status.factordb === 'ok' ? (
              <CheckCircle sx={{ color: draculaColors.green, fontSize: '0.9rem' }} />
            ) : status.factordb === 'error' ? (
              <ErrorOutlined sx={{ color: draculaColors.red, fontSize: '0.9rem' }} />
            ) : (
              <Box sx={{
                width: '0.9rem', height: '0.9rem', borderRadius: '50%',
                border: `2px solid ${draculaColors.comment}`,
                animation: `${pulse} 1.4s ease-in-out infinite`,
              }} />
            )}
            <Typography variant="caption" sx={{ color: draculaColors.foreground, fontSize: '0.7rem' }}>
              FactorDB
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {status.sagecell === 'ok' ? (
              <CheckCircle sx={{ color: draculaColors.green, fontSize: '0.9rem' }} />
            ) : status.sagecell === 'error' ? (
              <ErrorOutlined sx={{ color: draculaColors.red, fontSize: '0.9rem' }} />
            ) : (
              <Box sx={{
                width: '0.9rem', height: '0.9rem', borderRadius: '50%',
                border: `2px solid ${draculaColors.comment}`,
                animation: `${pulse} 1.4s ease-in-out infinite`,
              }} />
            )}
            <Typography variant="caption" sx={{ color: draculaColors.foreground, fontSize: '0.7rem' }}>
              SageMathCell
            </Typography>
          </Box>
        </Box>
      </List>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <Box sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ color: draculaColors.comment, display: 'block' }}>
          © 2026 yuzu-octopus
        </Typography>
        <Typography variant="caption" sx={{ color: draculaColors.comment, display: 'block' }}>
          Powered by{' '}
          <Link href="https://pages.github.com" target="_blank" rel="noopener" sx={{ color: draculaColors.purple }}>
            GitHub Pages
          </Link>
        </Typography>
        <Typography variant="caption" sx={{ color: draculaColors.comment, display: 'block' }}>
          Made with{' '}
          <Link href="https://vite.dev" target="_blank" rel="noopener" sx={{ color: draculaColors.purple }}>
            Vite
          </Link>
        </Typography>
      </Box>
      </Drawer>
    </>
  );
}
