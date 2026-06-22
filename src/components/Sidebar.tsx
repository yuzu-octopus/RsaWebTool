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
import { ExpandLess, ExpandMore, AutoFixHigh, MenuBook, SwapHoriz, CheckCircle, ErrorOutlined, VpnKey, Lock, Hub, Tag, Security, Menu, LockOpen, Search, GridOn, Send, Visibility, Science } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { pulse, MONO_FAMILY } from '../styles/shared';
import { CATEGORIES, attacksByCategory } from '../attacks';
import { CALCULATOR_ITEMS, SIDEBAR_MODULES } from '../config/sidebarItems';
import type { Attack } from '../types';
import { useAppContext } from '../hooks/useAppContext';
import env from '../config/env';

const drawerWidth = 220;

interface ServiceStatus {
  factordb: 'checking' | 'ok' | 'error';
  sagecell: 'checking' | 'ok' | 'error';
}

function catIcon(cat: string): React.ReactElement | null {
  switch (cat) {
    case 'Factorization': return <Search sx={{ fontSize: '1.1rem' }} />;
    case 'Partial Key / Lattice': return <GridOn sx={{ fontSize: '1.1rem' }} />;
    case 'Message / Protocol': return <Send sx={{ fontSize: '1.1rem' }} />;
    case 'Oracle': return <Visibility sx={{ fontSize: '1.1rem' }} />;
    case 'Advanced': return <Science sx={{ fontSize: '1.1rem' }} />;
    default: return null;
  }
}

function modIcon(id: string): React.ReactNode {
  switch (id) {
    case 'instructions': return <MenuBook sx={{ fontSize: '1.1rem' }} />;
    case 'magic': return <AutoFixHigh sx={{ fontSize: '1.1rem' }} />;
    case 'proofs': return <MenuBook sx={{ fontSize: '1.1rem' }} />;
    case 'format-converter': return <SwapHoriz sx={{ fontSize: '1.1rem' }} />;
    case 'pem': return <VpnKey sx={{ fontSize: '1.1rem' }} />;
    default: return null;
  }
}

function calcIcon(mode: string): React.ReactNode {
  switch (mode) {
    case 'rsa': return <VpnKey sx={{ fontSize: '1.1rem' }} />;
    case 'aes': return <Lock sx={{ fontSize: '1.1rem' }} />;
    case 'ecc': return <Hub sx={{ fontSize: '1.1rem' }} />;
    case 'hash': return <Tag sx={{ fontSize: '1.1rem' }} />;
    case 'dh': return <Security sx={{ fontSize: '1.1rem' }} />;
    default: return null;
  }
}

const sidebarActiveSx = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' },
} as const;
const sidebarInactiveSx = {
  backgroundColor: 'transparent',
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
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
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', px: 2, py: 2 }}>
        <Box sx={{
          width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: draculaColors.background, mb: 1,
        }}>
          <LockOpen sx={{ fontSize: '2rem', color: draculaColors.purple }} />
        </Box>
        <Typography sx={{ color: draculaColors.purple, fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.6, fontFamily: MONO_FAMILY }}>
          RSA CTF Tool
        </Typography>
        <Typography variant="caption" sx={{ color: draculaColors.comment, fontSize: '0.65rem', lineHeight: 1.66, fontFamily: MONO_FAMILY }}>
          SageMath Powered
        </Typography>
      </Box>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {CATEGORIES.map(cat => (
          <Box key={cat}>
            <ListItemButton
              onClick={() => toggleCat(cat)}
              sx={{ px: 2, minHeight: 40 }}
              aria-expanded={expandedCats.has(cat)}
              aria-controls={`sidebar-cat-${cat}`}
            >
              <Typography sx={{ color: draculaColors.foreground, fontWeight: 600, fontSize: '0.75rem', flex: 1, fontFamily: MONO_FAMILY }}>
                {cat}
              </Typography>
              {expandedCats.has(cat) ? <ExpandLess sx={{ color: draculaColors.comment, fontSize: '1rem' }} /> : <ExpandMore sx={{ color: draculaColors.comment, fontSize: '1rem' }} />}
            </ListItemButton>
            <Collapse in={expandedCats.has(cat)} unmountOnExit id={`sidebar-cat-${cat}`}>
              <List component="div" disablePadding>
                {(attacksByCategory.get(cat) || []).map(attack => (
                  <ListItemButton
                    key={attack.id}
                    id={`sidebar-attack-${attack.id}`}
                    onClick={() => handleAttackClick(attack)}
                    data-testid={`attack-${attack.id}`}
                    sx={{
                      pl: 4,
                      minHeight: 36,
                      ...(isAttackActive(attack.id) ? sidebarActiveSx : sidebarInactiveSx),
                    }}
                  >
                    <Box sx={{ width: 28, minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: draculaColors.comment }}>
                      {catIcon(cat)}
                    </Box>
                    <ListItemText
                      primary={attack.name}
                      slotProps={{ primary: { sx: { color: draculaColors.foreground, fontSize: '0.75rem', fontFamily: MONO_FAMILY } } }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Collapse>
          </Box>
        ))}

        <Box key="Calculators">
          <ListItemButton
            onClick={() => toggleCat('Calculators')}
            sx={{ px: 2, minHeight: 40 }}
            aria-expanded={expandedCats.has('Calculators')}
            aria-controls="sidebar-cat-Calculators"
          >
            <Typography sx={{ color: draculaColors.foreground, fontWeight: 600, fontSize: '0.75rem', flex: 1, fontFamily: MONO_FAMILY }}>
              Calculators
            </Typography>
            {expandedCats.has('Calculators') ? <ExpandLess sx={{ color: draculaColors.comment, fontSize: '1rem' }} /> : <ExpandMore sx={{ color: draculaColors.comment, fontSize: '1rem' }} />}
          </ListItemButton>
          <Collapse in={expandedCats.has('Calculators')} unmountOnExit id="sidebar-cat-Calculators">
            <List component="div" disablePadding>
              {CALCULATOR_ITEMS.map(item => (
                <ListItemButton
                  key={item.id}
                  id={`sidebar-calc-${item.calculatorMode}`}
                  onClick={() => { setViewMode('calculator'); setCalculatorMode(item.calculatorMode); }}
                  sx={{
                    pl: 4,
                    minHeight: 36,
                    ...(viewMode === 'calculator' && calculatorMode === item.calculatorMode ? sidebarActiveSx : sidebarInactiveSx),
                  }}
                >
                  <Box sx={{ width: 28, minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {calcIcon(item.calculatorMode)}
                  </Box>
                  <ListItemText
                    primary={item.label}
                    slotProps={{ primary: { sx: { color: draculaColors.foreground, fontSize: '0.85rem', fontFamily: MONO_FAMILY } } }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </Box>

        <Divider sx={{ borderColor: draculaColors.comment, my: 1 }} />

        {SIDEBAR_MODULES.map(mod => (
          <ListItemButton
            key={mod.id}
            id={`sidebar-view-${mod.mode}`}
            onClick={() => setViewMode(mod.mode as 'attack' | 'magic' | 'proofs' | 'calculator' | 'format-converter' | 'instructions' | 'pem')}
            sx={{
              pl: 4,
              minHeight: 36,
              ...(isViewActive(mod.mode) ? sidebarActiveSx : sidebarInactiveSx),
            }}
          >
            <Box sx={{ width: 28, minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {modIcon(mod.id)}
            </Box>
            <ListItemText
              primary={mod.label}
              slotProps={{ primary: { sx: { color: draculaColors.foreground, fontSize: '0.85rem', fontFamily: MONO_FAMILY } } }}
            />
          </ListItemButton>
        ))}

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
