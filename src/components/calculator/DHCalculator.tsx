import { useState, useCallback } from 'react';
import { Security } from '@mui/icons-material';
import { useAppContext } from '../../hooks/useAppContext';
import { CalculatorHeader } from './_shared/CalculatorHeader';
import { DHExplanationTab } from './DHExplanationTab';
import { DHKeyExchangeTab } from './DHKeyExchangeTab';
import { DHAttacksTab } from './DHAttacksTab';

const TABS = [
  { id: 'explanation', label: 'Explanation' },
  { id: 'keyexchange', label: 'Key Exchange' },
  { id: 'attacks', label: 'Attacks' },
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
      icon={Security}
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
