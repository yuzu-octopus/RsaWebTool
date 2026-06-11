import { lazy, Suspense, useEffect } from 'react';
import { Box, Skeleton } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { useAppContext } from '../../hooks/useAppContext';
import { colFlexSx, centeredPanelSx } from '../../styles/shared';
import type { CalculatorMode } from '../../types';

const RSACalculator = lazy(() => import('./RSACalculator'));
const AESCalculator = lazy(() => import('./AESCalculator'));
const ECCCalculator = lazy(() => import('./ECCCalculator'));
const HashCalculator = lazy(() => import('./HashCalculator'));
const DHCalculator = lazy(() => import('./DHCalculator'));

const MODE_BY_INDEX: CalculatorMode[] = ['rsa', 'aes', 'ecc', 'hash', 'dh'];

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
      <Box sx={{ ...centeredPanelSx, p: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
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
