import { useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import type { CalculatorMode } from '../../types';
import RSACalculator from './RSACalculator';
import AESCalculator from './AESCalculator';
import ECCCalculator from './ECCCalculator';
import HashCalculator from './HashCalculator';
import DHCalculator from './DHCalculator';

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

  return <ActiveComponent />;
}

export default Calculator;
