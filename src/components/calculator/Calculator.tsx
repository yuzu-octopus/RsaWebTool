import { lazy, Suspense, useEffect } from 'react';
import { Box, Skeleton, Tabs, Tab } from '@mui/material';
import { Calculate, Lock, Hub, Tag, Security } from '@mui/icons-material';
import { draculaColors } from '../../theme/dracula';
import { useAppContext } from '../../hooks/useAppContext';
import { colFlexSx, tabSx } from '../../styles/shared';
import type { CalculatorMode } from '../../types';

const RSACalculator = lazy(() => import('./RSACalculator'));
const AESCalculator = lazy(() => import('./AESCalculator'));
const ECCCalculator = lazy(() => import('./ECCCalculator'));
const HashCalculator = lazy(() => import('./HashCalculator'));
const DHCalculator = lazy(() => import('./DHCalculator'));

const MODE_BY_INDEX: CalculatorMode[] = ['rsa', 'aes', 'ecc', 'hash', 'dh'];

const CALCULATOR_TABS: { mode: CalculatorMode; label: string; icon: React.ReactElement }[] = [
  { mode: 'rsa', label: 'RSA', icon: <Calculate /> },
  { mode: 'aes', label: 'AES', icon: <Lock /> },
  { mode: 'ecc', label: 'ECC', icon: <Hub /> },
  { mode: 'hash', label: 'Hash', icon: <Tag /> },
  { mode: 'dh', label: 'DH', icon: <Security /> },
];

const COMPONENTS = [RSACalculator, AESCalculator, ECCCalculator, HashCalculator, DHCalculator];

export function Calculator() {
  const { viewMode, calculatorMode, setCalculatorMode } = useAppContext();

  // Keyboard shortcuts for calculator sub-tabs (⌘1-⌘5) — must be before early return
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as number;
      if (detail >= 0 && detail < MODE_BY_INDEX.length) {
        setCalculatorMode(MODE_BY_INDEX[detail]);
      }
    };
    window.addEventListener('calculator-switch-tab', handler);
    return () => window.removeEventListener('calculator-switch-tab', handler);
  }, [setCalculatorMode]);

  if (viewMode !== 'calculator') return null;

  const tabIndex = MODE_BY_INDEX.indexOf(calculatorMode);
  const ActiveComponent = COMPONENTS[tabIndex];

  return (
    <Box sx={colFlexSx}>
      {/* Calculator mode switcher */}
      <Tabs
        value={tabIndex < 0 ? 0 : tabIndex}
        onChange={(_e, value) => setCalculatorMode(MODE_BY_INDEX[value as number])}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          borderBottom: `1px solid ${draculaColors.comment}`,
          backgroundColor: draculaColors.background,
          '& .MuiTabs-flexContainer': { justifyContent: 'center' },
          '& .MuiTab-root': {
            ...tabSx,
            minHeight: 48,
            px: 3,
            '&:hover': { backgroundColor: draculaColors.currentLine },
          },
          '& .Mui-selected': { color: draculaColors.purple },
          '& .MuiTabs-indicator': { backgroundColor: draculaColors.purple },
        }}
      >
        {CALCULATOR_TABS.map(t => (
          <Tab key={t.mode} label={t.label} icon={t.icon} iconPosition="start" />
        ))}
      </Tabs>
      <Suspense
        fallback={
          <Skeleton
            variant="rectangular"
            height={200}
            sx={{ borderRadius: 1, bgcolor: draculaColors.currentLine }}
          />
        }
      >
        <ActiveComponent />
      </Suspense>
    </Box>
  );
}
