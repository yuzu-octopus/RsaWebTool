import { useState } from 'react';
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

import { ExpandLess, ExpandMore, AutoFixHigh, MenuBook, SwapHoriz, VpnKey, Lock, Hub, Tag, Security, Menu } from '@mui/icons-material';
import { draculaColors } from '../theme/dracula';
import { LogoIcon } from './_shared/LogoIcon';
import { MONO_FAMILY, ICON_SIZES } from '../styles/shared';
import { CATEGORIES, attacksByCategory } from '../attacks';
import { CALCULATOR_ITEMS, SIDEBAR_MODULES } from '../config/sidebarItems';
import type { Attack } from '../types';
import { useAppContext } from '../hooks/useAppContext';


const drawerWidth = 220;

function modIcon(id: string, color: string): React.ReactNode {
  switch (id) {
    case 'instructions': return <MenuBook sx={{ color, fontSize: ICON_SIZES.lg }} />;
    case 'magic': return <AutoFixHigh sx={{ color, fontSize: ICON_SIZES.lg }} />;
    case 'proofs': return <MenuBook sx={{ color, fontSize: ICON_SIZES.lg }} />;
    case 'format-converter': return <SwapHoriz sx={{ color, fontSize: ICON_SIZES.lg }} />;
    case 'pem': return <VpnKey sx={{ color, fontSize: ICON_SIZES.lg }} />;
    default: return null;
  }
}

function calcIcon(mode: string): React.ReactNode {
  const colors: Record<string, string> = { rsa: draculaColors.cyan, aes: draculaColors.purple, ecc: draculaColors.green, hash: draculaColors.orange, dh: draculaColors.pink };
  switch (mode) {
    case 'rsa': return <VpnKey sx={{ color: colors[mode], fontSize: ICON_SIZES.lg }} />;
    case 'aes': return <Lock sx={{ color: colors[mode], fontSize: ICON_SIZES.lg }} />;
    case 'ecc': return <Hub sx={{ color: colors[mode], fontSize: ICON_SIZES.lg }} />;
    case 'hash': return <Tag sx={{ color: colors[mode], fontSize: ICON_SIZES.lg }} />;
    case 'dh': return <Security sx={{ color: colors[mode], fontSize: ICON_SIZES.lg }} />;
    default: return null;
  }
}

const sidebarActiveSx = {
  backgroundColor: 'rgba(255,255,255,0.08)',
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)' },
  '&:focus-visible': { outline: `2px solid ${draculaColors.cyan}`, outlineOffset: -2 },
} as const;
const sidebarInactiveSx = {
  backgroundColor: 'transparent',
  '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
  '&:focus-visible': { outline: `2px solid ${draculaColors.cyan}`, outlineOffset: -2 },
} as const;

export function Sidebar() {
  const { selectedAttack, setSelectedAttack, setViewMode, viewMode, calculatorMode, setCalculatorMode } = useAppContext();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set([...CATEGORIES, 'Calculators']));

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
    if (isMobile) setMobileOpen(false);
    setSelectedAttack(attack);
    setViewMode('attack');
  };

  const isAttackActive = (id: string) => viewMode === 'attack' && selectedAttack?.id === id;
  const isViewActive = (mode: string) => viewMode === mode;

  return (
    <>
      <IconButton
        aria-label="Open navigation"
        onClick={() => setMobileOpen(true)}
        sx={{ display: { xs: 'flex', sm: 'none' }, position: 'fixed', top: 8, left: 8, zIndex: theme => theme.zIndex.drawer + 1, color: draculaColors.cyan }}
      >
        <Menu />
      </IconButton>
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
      <Box sx={{ textAlign: 'center', px: 2, pt: 3, pb: 2 }}>
        <Box sx={{
          width: 72, height: 72, mx: 'auto', mb: 2,
          borderRadius: '50%', backgroundColor: draculaColors.background,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LogoIcon size={32} />
        </Box>
        <Typography sx={{ color: draculaColors.purple, fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.5 }}>
          RSA CTF Tool
        </Typography>
        <Typography sx={{ color: draculaColors.comment, fontSize: '0.7rem', lineHeight: 1.66 }}>
          SageMath Powered
        </Typography>
      </Box>

      <Divider sx={{ borderColor: draculaColors.comment }} />

      <List sx={{ flex: 1, overflow: 'auto' }}>
        {CATEGORIES.map(cat => (
          <Box key={cat}>
            <ListItemButton
              onClick={() => toggleCat(cat)}
              sx={{ px: 2, minHeight: 40, '&:hover': { backgroundColor: draculaColors.background } }}
              aria-expanded={expandedCats.has(cat)}
              aria-controls={`sidebar-cat-${cat}`}
            >
              <Typography sx={{ color: draculaColors.cyan, fontWeight: 600, fontSize: '0.85rem', flex: 1, fontFamily: MONO_FAMILY }}>
                {cat}
              </Typography>
              {expandedCats.has(cat) ? <ExpandLess sx={{ color: draculaColors.comment, fontSize: ICON_SIZES.md }} /> : <ExpandMore sx={{ color: draculaColors.comment, fontSize: ICON_SIZES.md }} />}
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
            sx={{ px: 2, minHeight: 40, '&:hover': { backgroundColor: draculaColors.background } }}
            aria-expanded={expandedCats.has('Calculators')}
            aria-controls="sidebar-cat-Calculators"
          >
            <Typography sx={{ color: draculaColors.foreground, fontWeight: 600, fontSize: '0.75rem', flex: 1, fontFamily: MONO_FAMILY }}>
              Calculators
            </Typography>
            {expandedCats.has('Calculators') ? <ExpandLess sx={{ color: draculaColors.comment, fontSize: ICON_SIZES.md }} /> : <ExpandMore sx={{ color: draculaColors.comment, fontSize: ICON_SIZES.md }} />}
          </ListItemButton>
          <Collapse in={expandedCats.has('Calculators')} unmountOnExit id="sidebar-cat-Calculators">
            <List component="div" disablePadding>
              {CALCULATOR_ITEMS.map(item => {
                const calcColors: Record<string, string> = { rsa: draculaColors.cyan, aes: draculaColors.purple, ecc: draculaColors.green, hash: draculaColors.orange, dh: draculaColors.pink };
                const calcColor = calcColors[item.calculatorMode] || draculaColors.foreground;
                return (
                <ListItemButton
                  key={item.id}
                  id={`sidebar-calc-${item.calculatorMode}`}
                  onClick={() => { setViewMode('calculator'); setCalculatorMode(item.calculatorMode); if (isMobile) setMobileOpen(false); }}
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
                    slotProps={{ primary: { sx: { color: calcColor, fontSize: '0.85rem', fontFamily: MONO_FAMILY } } }}
                  />
                </ListItemButton>
                );
              })}
            </List>
          </Collapse>
        </Box>

        <Divider sx={{ borderColor: draculaColors.comment, my: 1 }} />

        {SIDEBAR_MODULES.map(mod => {
          const modColors: Record<string, string> = { instructions: draculaColors.green, magic: draculaColors.purple, proofs: draculaColors.cyan, 'format-converter': draculaColors.orange, pem: draculaColors.yellow };
          const modColor = modColors[mod.id] || draculaColors.foreground;
          return (
          <ListItemButton
            key={mod.id}
            id={`sidebar-view-${mod.mode}`}
            onClick={() => { setViewMode(mod.mode as 'attack' | 'magic' | 'proofs' | 'calculator' | 'format-converter' | 'instructions' | 'pem'); if (isMobile) setMobileOpen(false); }}
            sx={{
              pl: 4,
              minHeight: 36,
              ...(isViewActive(mod.mode) ? sidebarActiveSx : sidebarInactiveSx),
            }}
          >
            <Box sx={{ width: 28, minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {modIcon(mod.id, modColor)}
            </Box>
            <ListItemText
              primary={mod.label}
              slotProps={{ primary: { sx: { color: modColor, fontSize: '0.85rem', fontFamily: MONO_FAMILY } } }}
            />
          </ListItemButton>
          );
        })}

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
