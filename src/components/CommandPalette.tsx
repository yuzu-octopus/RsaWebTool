import { useState, useEffect, useMemo, useCallback, startTransition, type KeyboardEvent } from 'react';
import {
  Dialog, DialogContent, TextField, List, ListItemButton, ListItemText,
  Typography, Box, Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MenuBook from '@mui/icons-material/MenuBook';
import AutoFixHigh from '@mui/icons-material/AutoFixHigh';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import VpnKey from '@mui/icons-material/VpnKey';
import Lock from '@mui/icons-material/Lock';
import Hub from '@mui/icons-material/Hub';
import Tag from '@mui/icons-material/Tag';
import Security from '@mui/icons-material/Security';
import { useAppContext } from '../hooks/useAppContext';
import { attacks } from '../attacks';
import { SIDEBAR_MODULES, ALL_SIDEBAR_ITEMS } from '../config/sidebarItems';
import { draculaColors } from '../theme/dracula';
import { MONO_FAMILY } from '../styles/shared';
import type { Attack, AttackCategory, CalculatorMode } from '../types';

const MODULE_ICONS: Record<string, React.ElementType> = {
  instructions: MenuBook,
  magic: AutoFixHigh,
  proofs: MenuBook,
  'format-converter': SwapHoriz,
  pem: VpnKey,
};

const CALCULATOR_ICONS: Record<CalculatorMode, React.ElementType> = {
  rsa: VpnKey,
  aes: Lock,
  ecc: Hub,
  hash: Tag,
  dh: Security,
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

interface ChipSpec {
  label: string;
  color: string;
  /** 'filled' = solid 12% bg, 'outlined' = transparent bg with colored border. */
  variant: 'filled' | 'outlined';
}

interface CommandPaletteItemProps {
  Icon: React.ElementType;
  primary: string;
  secondary?: string;
  chips: ChipSpec[];
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

/**
 * Single base component used for every row in the command palette.
 * The previous version had 3 inline render branches (view / calculator-tab /
 * attack) that duplicated the ListItemButton sx, hover state, and chip layout.
 * Centralising it here keeps styling consistent and makes it trivial to add
 * a new entry type.
 */
function CommandPaletteItem({
  Icon, primary, secondary, chips, isSelected, onClick, onMouseEnter,
}: CommandPaletteItemProps) {
  return (
    <ListItemButton
      selected={isSelected}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
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
        primary={primary}
        secondary={secondary}
        slotProps={{
          primary: {
            sx: {
              color: draculaColors.foreground,
              fontFamily: MONO_FAMILY,
              fontSize: '0.8rem',
            },
          },
          secondary: {
            sx: {
              color: draculaColors.comment,
              fontFamily: MONO_FAMILY,
              fontSize: '0.7rem',
            },
          },
        }}
      />
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {chips.map((chip, i) => (
          <Chip
            key={i}
            label={chip.label}
            size="small"
            sx={{
              color: chip.color,
              fontSize: '0.6rem',
              height: 18,
              bgcolor: chip.variant === 'filled' ? `${chip.color}20` : 'transparent',
              border: chip.variant === 'outlined' ? `1px solid ${chip.color}` : 'none',
            }}
          />
        ))}
      </Box>
    </ListItemButton>
  );
}

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

  // Combine views and attacks into a single list. All three item types
  // (attacks, calculator tabs, modules) are filtered by query — the previous
  // version only filtered attacks, so the 5 calculator tabs + 5 modules
  // always showed through regardless of the query string.
  const allItems = useMemo(() => {
    type PaletteItem =
      | { type: 'view'; module: typeof SIDEBAR_MODULES[number]; index: number }
      | { type: 'attack'; attack: Attack; index: number }
      | { type: 'calculator-tab'; calculatorMode: CalculatorMode; label: string; index: number };

    const q = query.toLowerCase().trim();
    const items: PaletteItem[] = [];
    let idx = 0;

    // Build maps once; the filter and the loop both need to look up by id.
    const attacksMap = new Map(attacks.map(a => [a.id, a]));
    const modulesMap = new Map(SIDEBAR_MODULES.map(m => [m.id, m]));

    const filteredSidebarItems = ALL_SIDEBAR_ITEMS.filter(item => {
      if (!q) return true;
      if (item.type === 'attack') {
        const attack = attacksMap.get(item.id);
        if (!attack) return false;
        return attack.name.toLowerCase().includes(q) ||
          attack.category.toLowerCase().includes(q) ||
          attack.id.toLowerCase().includes(q);
      }
      if (item.type === 'calculator-tab') {
        return item.label.toLowerCase().includes(q);
      }
      // module
      return item.label.toLowerCase().includes(q);
    });

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
          placeholder="Search attacks, calculators, and views..."
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon sx={{ color: draculaColors.comment, mr: 1, fontSize: 20 }} />
              ),
              disableUnderline: true,
              sx: {
                color: draculaColors.foreground,
                fontSize: '1rem',
                fontFamily: MONO_FAMILY,
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
                <CommandPaletteItem
                  key={`view-${item.module.id}`}
                  Icon={Icon}
                  primary={item.module.label}
                  chips={[{ label: 'Module', color: draculaColors.comment, variant: 'outlined' }]}
                  isSelected={isSelected}
                  onClick={() => selectView(item.module.mode)}
                  onMouseEnter={() => setSelectedIndex(item.index)}
                />
              );
            }
            if (item.type === 'calculator-tab') {
              const Icon = CALCULATOR_ICONS[item.calculatorMode];
              return (
                <CommandPaletteItem
                  key={`calc-${item.calculatorMode}`}
                  Icon={Icon}
                  primary={item.label}
                  chips={[{ label: 'Calculator', color: draculaColors.cyan, variant: 'outlined' }]}
                  isSelected={isSelected}
                  onClick={() => selectCalculatorTab(item.calculatorMode)}
                  onMouseEnter={() => setSelectedIndex(item.index)}
                />
              );
            }
            const attack = item.attack;
            const categoryColor = CATEGORY_COLORS[attack.category];
            const hasFrontendCheck = !!attack.frontendCheck;
            return (
              <CommandPaletteItem
                key={attack.id}
                Icon={HourglassEmpty}
                primary={attack.name}
                secondary={attack.id}
                chips={[
                  { label: attack.category, color: categoryColor, variant: 'filled' },
                  {
                    label: hasFrontendCheck ? 'Local' : 'SageMath',
                    color: hasFrontendCheck ? draculaColors.green : draculaColors.orange,
                    variant: 'outlined',
                  },
                ]}
                isSelected={isSelected}
                onClick={() => selectAttack(attack)}
                onMouseEnter={() => setSelectedIndex(item.index)}
              />
            );
          })}
          {query.trim() && allItems.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography
                sx={{
                  color: draculaColors.comment,
                  fontFamily: MONO_FAMILY,
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
