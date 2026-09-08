import type { ReactNode } from 'react';
import { TabList, Tab } from '@astryxdesign/core/TabList';

export interface TabItem {
  id: string;
  label: string;
  /** Optional icon shown inline to the left of the label. */
  icon?: ReactNode;
}

interface CalculatorSubTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function CalculatorSubTabs({ tabs, activeTab, onChange }: CalculatorSubTabsProps) {
  const active = tabs.some(t => t.id === activeTab) ? activeTab : tabs[0].id;

  return (
    <TabList value={active} onChange={onChange} hasDivider>
      {tabs.map(t => (
        <Tab key={t.id} value={t.id} label={t.label} icon={t.icon} />
      ))}
    </TabList>
  );
}
