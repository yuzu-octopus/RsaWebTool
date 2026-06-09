import { useState, useEffect, useMemo, useCallback, startTransition, type KeyboardEvent } from 'react';
import {
  Dialog, DialogContent, TextField, List, ListItemButton, ListItemText,
  Typography, Box, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuBook from '@mui/icons-material/MenuBook';
import AutoFixHigh from '@mui/icons-material/AutoFixHigh';
import Calculate from '@mui/icons-material/Calculate';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import VpnKey from '@mui/icons-material/VpnKey';
import { useAppContext } from '../hooks/useAppContext';
import { attacks } from '../attacks';
import { SIDEBAR_MODULES, ALL_SIDEBAR_ITEMS } from '../config/sidebarItems';
import { draculaColors } from '../theme/dracula';
import type { Attack, AttackCategory, CalculatorMode } from '../types';

const MODULE_ICONS: Record<string, React.ElementType> = {
  instructions: MenuBook,
  magic: AutoFixHigh,
  proofs: MenuBook,
  calculator: Calculate,
  'format-converter': SwapHoriz,
  pem: VpnKey,
};

const CATEGORY_COLORS: Record<AttackCategory, string> = {
  Factorization: draculaColors.green,
  'Partial Key / Lattice': draculaColors.purple,
  'Message / Protocol': draculaColors.cyan,
  Oracle: draculaColors.orange,
  Advanced: draculaColors.yellow,
  Symmetric: draculaColors.pink,
  Hash: draculaColors.cyan,
  ECC: draculaColors.purple,
};

const VIEW_MODES = ['attack', 'magic', 'proofs', 'calculator', 'format-converter', 'instructions', 'pem'] as const;
type ViewMode = typeof VIEW_MODES[number];

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setViewMode,
    setSelectedAttack,
    setCalculatorMode,
  } = useAppContext();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset query and selection when palette opens
  useEffect(() => {
    if (commandPaletteOpen) {
      startTransition(() => {
        setQuery('');
        setSelectedIndex(0);
      });
    }
  }, [commandPaletteOpen]);

  // Combine views and attacks into a single list, views at the bottom
  const allItems = useMemo(() => {
    const items: Array<
      | { type: 'view'; module: typeof SIDEBAR_MODULES[number]; index: number }
      | { type: 'attack'; attack: Attack; index: number }
      | { type: 'calculator-tab'; calculatorMode: CalculatorMode; label: string; index: number }
    > = [];
    let idx = 0;

    // Filter attacks by query using shared sidebar ordering
    const filteredSidebarItems = ALL_SIDEBAR_ITEMS.filter(item => {
      if (item.type !== 'attack') return true;
      const attack = attacks.find(a => a.id === item.id);
      if (!attack) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase().trim();
      return attack.name.toLowerCase().includes(q) ||
        attack.category.toLowerCase().includes(q) ||
        attack.id.toLowerCase().includes(q);
    });

    const attacksMap = new Map(attacks.map(a => [a.id, a]));
    const modulesMap = new Map(SIDEBAR_MODULES.map(m => [m.id, m]));

    for (const item of filteredSidebarItems) {
      if (item.type === 'attack') {
        const attack = attacksMap.get(item.id);
        if (attack) items.push({ type: 'attack', attack, index: idx++ });
      } else if (item.type === 'calculator-tab') {
        items.push({ type: 'calculator-tab', calculatorMode: item.calculatorMode, label: item.label, index: idx++ });
      } else {
        const mod = modulesMap.get(item.id);
        if (mod) items.push({ type: 'view', module: mod, index: idx++ });
      }
    }
    return items;
  }, [query]);

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
  }, [setCommandPaletteOpen]);

  const selectView = useCallback(
    (mode: string) => {
      if (VIEW_MODES.includes(mode as ViewMode)) {
        setViewMode(mode as ViewMode);
      }
      close();
    },
    [setViewMode, close],
  );

  const selectCalculatorTab = useCallback(
    (calculatorMode: CalculatorMode) => {
      setViewMode('calculator');
      setCalculatorMode(calculatorMode);
      close();
    },
    [setViewMode, setCalculatorMode, close],
  );

  const selectAttack = useCallback(
    (attack: Attack) => {
      setSelectedAttack(attack);
      setViewMode('attack');
      close();
    },
    [setSelectedAttack, setViewMode, close],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (allItems.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % allItems.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex < allItems.length) {
            const item = allItems[selectedIndex];
            if (item.type === 'view') selectView(item.module.mode);
            else if (item.type === 'calculator-tab') selectCalculatorTab(item.calculatorMode);
            else selectAttack(item.attack);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [allItems, selectedIndex, selectView, selectAttack, selectCalculatorTab, close],
  );

  return (
    <Dialog
      open={commandPaletteOpen}
      onClose={close}
      maxWidth={false}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
        },
        paper: {
          sx: {
            bgcolor: '#282a36 !important',
            color: draculaColors.foreground,
            width: 480,
            maxHeight: 400,
            borderRadius: '12px',
            overflow: 'hidden',
            margin: 0,
            border: `1px solid ${draculaColors.currentLine}`,
            boxShadow: 'none',
          },
        },
      }}
    >
      <Box sx={{ p: 1.5, pb: 0, bgcolor: '#282a36' }}>
        <TextField
          fullWidth
          autoFocus
          variant="standard"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search attacks and views..."
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon sx={{ color: draculaColors.comment, mr: 1, fontSize: 20 }} />
              ),
              disableUnderline: true,
              sx: {
                color: draculaColors.foreground,
                fontSize: '1rem',
                fontFamily: "'JetBrains Mono', monospace",
                bgcolor: draculaColors.currentLine,
                borderRadius: '8px',
                px: 1.5,
                py: 0.75,
                border: `1px solid ${draculaColors.currentLine}`,
              },
            },
          }}
        />
      </Box>
      <DialogContent sx={{ p: 0, overflow: 'auto', bgcolor: '#282a36', pb: '20vh' }}>
        <List dense>
          {allItems.map((item) => {
            const isSelected = item.index === selectedIndex;
            if (item.type === 'view') {
              const Icon = MODULE_ICONS[item.module.mode] ?? MenuBook;
              return (
                <ListItemButton
                  key={`view-${item.module.id}`}
                  selected={isSelected}
                  onClick={() => selectView(item.module.mode)}
                  onMouseEnter={() => setSelectedIndex(item.index)}
                  sx={{
                    px: 2,
                    py: 0.75,
                    backgroundColor: isSelected ? draculaColors.currentLine : 'transparent',
                    '&:hover': { backgroundColor: draculaColors.currentLine },
                    borderLeft: `3px solid ${isSelected ? draculaColors.purple : 'transparent'}`,
                  }}
                >
                  <Icon sx={{ color: draculaColors.comment, mr: 1.5, fontSize: 20 }} />
                  <ListItemText
                    primary={item.module.label}
                    slotProps={{
                      primary: {
                        sx: {
                          color: draculaColors.foreground,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.8rem',
                        },
                      },
                    }}
                  />
                  <Chip
                    label="View"
                    size="small"
                    sx={{
                      color: draculaColors.comment,
                      fontSize: '0.6rem',
                      height: 18,
                      bgcolor: 'transparent',
                      border: `1px solid ${draculaColors.comment}`,
                    }}
                  />
                </ListItemButton>
              );
            }
            if (item.type === 'calculator-tab') {
              return (
                <ListItemButton
                  key={`calc-${item.calculatorMode}`}
                  selected={isSelected}
                  onClick={() => selectCalculatorTab(item.calculatorMode)}
                  onMouseEnter={() => setSelectedIndex(item.index)}
                  sx={{
                    px: 2,
                    py: 0.75,
                    backgroundColor: isSelected ? draculaColors.currentLine : 'transparent',
                    '&:hover': { backgroundColor: draculaColors.currentLine },
                    borderLeft: `3px solid ${isSelected ? draculaColors.purple : 'transparent'}`,
                  }}
                >
                  <Calculate sx={{ color: draculaColors.comment, mr: 1.5, fontSize: 20 }} />
                  <ListItemText
                    primary={item.label}
                    slotProps={{
                      primary: {
                        sx: {
                          color: draculaColors.foreground,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '0.8rem',
                        },
                      },
                    }}
                  />
                  <Chip
                    label="Calculator"
                    size="small"
                    sx={{
                      color: draculaColors.cyan,
                      fontSize: '0.6rem',
                      height: 18,
                      bgcolor: 'transparent',
                      border: `1px solid ${draculaColors.cyan}`,
                    }}
                  />
                </ListItemButton>
              );
            }
            const attack = item.attack;
            const categoryColor = CATEGORY_COLORS[attack.category];
            const hasFrontendCheck = !!attack.frontendCheck;
            return (
              <ListItemButton
                key={attack.id}
                selected={isSelected}
                onClick={() => selectAttack(attack)}
                onMouseEnter={() => setSelectedIndex(item.index)}
                sx={{
                  px: 2,
                  py: 0.75,
                  backgroundColor: isSelected ? draculaColors.currentLine : 'transparent',
                  '&:hover': { backgroundColor: draculaColors.currentLine },
                  borderLeft: `3px solid ${isSelected ? draculaColors.purple : 'transparent'}`,
                }}
              >
                <HourglassEmpty sx={{ color: draculaColors.comment, mr: 1.5, fontSize: 20 }} />
                <ListItemText
                  primary={attack.name}
                  secondary={attack.id}
                  slotProps={{
                    primary: {
                      sx: {
                        color: draculaColors.foreground,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.8rem',
                      },
                    },
                    secondary: {
                      sx: {
                        color: draculaColors.comment,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '0.7rem',
                      },
                    },
                  }}
                />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip
                    label={attack.category}
                    size="small"
                    sx={{
                      color: categoryColor,
                      fontSize: '0.6rem',
                      height: 18,
                      bgcolor: `${categoryColor}20`,
                      border: 'none',
                    }}
                  />
                  <Chip
                    label={hasFrontendCheck ? 'Local' : 'SageMath'}
                    size="small"
                    sx={{
                      color: hasFrontendCheck ? draculaColors.green : draculaColors.orange,
                      fontSize: '0.6rem',
                      height: 18,
                      bgcolor: 'transparent',
                      border: `1px solid ${hasFrontendCheck ? draculaColors.green : draculaColors.orange}`,
                    }}
                  />
                </Box>
              </ListItemButton>
            );
          })}
          {query.trim() && allItems.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography
                sx={{
                  color: draculaColors.comment,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.8rem',
                }}
              >
                No matches for &quot;{query}&quot;
              </Typography>
            </Box>
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
}
