import { Tabs, Tab } from '@mui/material';
import { draculaColors } from '../../theme/dracula';
import { tabSx } from '../../styles/shared';

interface TabItem {
  id: string;
  label: string;
}

interface CalculatorSubTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
}

export function CalculatorSubTabs({ tabs, activeTab, onChange }: CalculatorSubTabsProps) {
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  return (
    <Tabs
      value={activeIndex < 0 ? 0 : activeIndex}
      onChange={(_e, value) => {
        const idx = value as number;
        onChange(tabs[idx]?.id ?? tabs[0].id);
      }}
      sx={{
        mb: 2,
        borderBottom: `1px solid ${draculaColors.comment}`,
        minHeight: 40,
        backgroundColor: draculaColors.background,
        '& .MuiTabs-flexContainer': { justifyContent: 'flex-start' },
        '& .MuiTab-root': { ...tabSx, px: 3 },
        '& .Mui-selected': { color: draculaColors.cyan },
        '& .MuiTabs-indicator': { backgroundColor: draculaColors.cyan },
      }}
    >
      {tabs.map(t => (
        <Tab key={t.id} label={t.label} />
      ))}
    </Tabs>
  );
}
