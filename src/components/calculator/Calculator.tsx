import { lazy, Suspense, useEffect } from 'react';
import { Box, Tabs, Tab, Skeleton } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { useAppContext } from '../../hooks/useAppContext';
import { colFlexSx, centeredPanelSx, tabSx } from '../../styles/shared';
import type { CalculatorMode } from '../../types';

const RSACalculator = lazy(() => import('./RSACalculator'));
const AESCalculator = lazy(() => import('./AESCalculator'));
const ECCCalculator = lazy(() => import('./ECCCalculator'));
const HashCalculator = lazy(() => import('./HashCalculator'));

const TABS: { label: string; mode: CalculatorMode }[] = [
  { label: 'RSA', mode: 'rsa' },
  { label: 'AES', mode: 'aes' },
  { label: 'ECC', mode: 'ecc' },
  { label: 'Hash', mode: 'hash' },
];

const TAB_INDEX: Record<CalculatorMode, number> = {
  rsa: 0,
  aes: 1,
  ecc: 2,
  hash: 3,
};

const MODE_BY_INDEX: CalculatorMode[] = ['rsa', 'aes', 'ecc', 'hash'];

const COMPONENTS = [RSACalculator, AESCalculator, ECCCalculator, HashCalculator];

export function Calculator() {
  const { viewMode, calculatorMode, setCalculatorMode } = useAppContext();

  // Keyboard shortcuts for calculator sub-tabs (⌘1-⌘4) — must be before early return
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

  const tabIndex = TAB_INDEX[calculatorMode];
  const ActiveComponent = COMPONENTS[tabIndex];

  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Tabs
            value={tabIndex}
            onChange={(_e, v) => setCalculatorMode(MODE_BY_INDEX[v as number])}
            sx={{
              mb: 2,
              borderBottom: `1px solid ${draculaColors.comment}`,
              '& .MuiTabs-indicator': { backgroundColor: draculaColors.cyan },
            }}
          >
            {TABS.map(t => (
              <Tab key={t.mode} label={t.label} sx={tabSx} />
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
      </Box>
    </Box>
  );
}
