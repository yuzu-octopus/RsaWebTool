import { useEffect } from 'react';
import { TabList, Tab } from '@astryxdesign/core/TabList';
import { Stack } from '@astryxdesign/core/Stack';
import { useAppContext } from '../../hooks/useAppContext';
import type { CalculatorMode } from '../../types';
import RSACalculator from './RSACalculator';
import AESCalculator from './AESCalculator';
import ECCCalculator from './ECCCalculator';
import HashCalculator from './HashCalculator';
import DHCalculator from './DHCalculator';

const MODE_BY_INDEX: CalculatorMode[] = ['rsa', 'aes', 'ecc', 'hash', 'dh'];

const CALCULATOR_TABS: { mode: CalculatorMode; label: string }[] = [
  { mode: 'rsa', label: 'RSA' },
  { mode: 'aes', label: 'AES' },
  { mode: 'ecc', label: 'ECC' },
  { mode: 'hash', label: 'Hash' },
  { mode: 'dh', label: 'DH' },
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
    <Stack direction="vertical">
      {/* Calculator mode switcher */}
      <TabList
        value={tabIndex < 0 ? MODE_BY_INDEX[0] : MODE_BY_INDEX[tabIndex]}
        onChange={value => setCalculatorMode(value as CalculatorMode)}
        layout="fill"
        hasDivider
      >
        {CALCULATOR_TABS.map(t => (
          <Tab key={t.mode} value={t.mode} label={t.label} />
        ))}
      </TabList>
      <ActiveComponent />
    </Stack>
  );
}

export default Calculator;
