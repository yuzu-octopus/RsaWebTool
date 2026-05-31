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
import { useAppContext } from '../hooks/useAppContext';
import { attacks } from '../attacks';
import { draculaColors } from '../theme/dracula';
import type { Attack, AttackCategory } from '../types';

const VIEWS = [
  { label: 'Instructions', icon: MenuBook, mode: 'instructions' as const },
  { label: 'Magic Panel', icon: AutoFixHigh, mode: 'magic' as const },
  { label: 'RSA Calculator', icon: Calculate, mode: 'calculator' as const },
  { label: 'Format Converter', icon: SwapHoriz, mode: 'format-converter' as const },
  { label: 'Proof Index', icon: MenuBook, mode: 'proofs' as const },
];

const CATEGORY_COLORS: Record<AttackCategory, string> = {
  Factorization: draculaColors.green,
  'Partial Key / Lattice': draculaColors.purple,
  'Message / Protocol': draculaColors.cyan,
  Oracle: draculaColors.orange,
  Advanced: draculaColors.yellow,
};

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setViewMode,
    setSelectedAttack,
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

  const filteredAttacks = useMemo(() => {
    if (!query.trim()) return attacks;
    const q = query.toLowerCase().trim();
    return attacks
      .filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q),
      )
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(q) ? 1 : 0;
        const bStarts = b.name.toLowerCase().startsWith(q) ? 1 : 0;
        return bStarts - aStarts;
      });
  }, [query]);

  // Combine views and attacks into a single list, views at the bottom
  const allItems = useMemo(() => {
    const items: Array<
      | { type: 'view'; view: typeof VIEWS[number]; index: number }
      | { type: 'attack'; attack: Attack; index: number }
    > = [];
    let idx = 0;

    // Attacks first
    for (const attack of filteredAttacks) {
      items.push({ type: 'attack', attack, index: idx++ });
    }
    // Views at the bottom
    for (const view of VIEWS) {
      items.push({ type: 'view', view, index: idx++ });
    }
    return items;
  }, [filteredAttacks]);

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
  }, [setCommandPaletteOpen]);

  const selectView = useCallback(
    (mode: 'instructions' | 'magic' | 'calculator' | 'format-converter' | 'proofs') => {
      setViewMode(mode);
      close();
    },
    [setViewMode, close],
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
            if (item.type === 'view') selectView(item.view.mode);
            else selectAttack(item.attack);
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [allItems, selectedIndex, selectView, selectAttack, close],
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
      <Box sx={{ p: 1.5, pb: 0 }}>
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
              },
            },
          }}
        />
      </Box>
      <DialogContent sx={{ p: 0, overflow: 'auto', bgcolor: '#282a36' }}>
        <List dense>
          {allItems.map((item) => {
            const isSelected = item.index === selectedIndex;
            if (item.type === 'view') {
              const Icon = item.view.icon;
              return (
                <ListItemButton
                  key={`view-${item.view.label}`}
                  selected={isSelected}
                  onClick={() => selectView(item.view.mode)}
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
                    primary={item.view.label}
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
