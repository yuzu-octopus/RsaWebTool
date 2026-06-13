import { useState, useCallback } from 'react';
import { MenuBook, SwapHoriz, Bolt } from '@mui/icons-material';
import { useAppContext } from '../../hooks/useAppContext';
import { CalculatorHeader } from './_shared/CalculatorHeader';
import { DHExplanationTab } from './DHExplanationTab';
import { DHKeyExchangeTab } from './DHKeyExchangeTab';
import { DHAttacksTab } from './DHAttacksTab';

const TABS = [
  { id: 'explanation', label: 'Explanation', icon: <MenuBook fontSize="small" /> },
  { id: 'keyexchange', label: 'Key Exchange', icon: <SwapHoriz fontSize="small" /> },
  { id: 'attacks', label: 'Attacks', icon: <Bolt fontSize="small" /> },
];

export default function DHCalculator() {
  const [tab, setTab] = useState('explanation');
  const { setOutputResult, setOutputError, setOutputSource } = useAppContext();

  const handleTabChange = useCallback((tabId: string) => {
    setTab(tabId);
    setOutputResult(null);
    setOutputError(null);
    setOutputSource(null);
  }, [setOutputResult, setOutputError, setOutputSource]);

  return (
    <CalculatorHeader
      title="DH Calculator"
      subtitle="Diffie-Hellman key exchange simulation and discrete log attacks"
      tabs={TABS}
      activeTab={tab}
      onTabChange={handleTabChange}
    >
      {tab === 'explanation' && <DHExplanationTab />}
      {tab === 'keyexchange' && <DHKeyExchangeTab />}
      {tab === 'attacks' && <DHAttacksTab />}
    </CalculatorHeader>
  );
}
