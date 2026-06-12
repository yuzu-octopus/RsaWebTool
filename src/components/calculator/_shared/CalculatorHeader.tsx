import type { ReactNode, ElementType } from 'react';
import { Box, Typography } from '@mui/material';
import {
  colFlexSx,
  centeredPanelSx,
  pageTitleSx,
  subTitleSx,
} from '../../../styles/shared';
import { CalculatorSubTabs } from '../CalculatorSubTabs';

export interface CalculatorHeaderTab {
  id: string;
  label: string;
}

/**
 * Base props shared by both variants.
 */
interface CalculatorHeaderBase {
  /** Icon component to render next to the title (e.g., `Lock`, `Hub`, `VpnKey`). */
  icon: ElementType;
  /** Page title (h3). */
  title: string;
  /** One-line subtitle shown under the title. */
  subtitle?: string;
  /** The active tab's content. */
  children: ReactNode;
}

/**
 * Variant WITH sub-tabs: tabs/activeTab/onTabChange are required together.
 */
export interface CalculatorHeaderWithTabs extends CalculatorHeaderBase {
  tabs: CalculatorHeaderTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

/**
 * Variant WITHOUT sub-tabs: tabs/activeTab/onTabChange must be omitted.
 */
export interface CalculatorHeaderWithoutTabs extends CalculatorHeaderBase {
  tabs?: undefined;
  activeTab?: undefined;
  onTabChange?: undefined;
}

export type CalculatorHeaderProps = CalculatorHeaderWithTabs | CalculatorHeaderWithoutTabs;

/**
 * Standard shell for every calculator (RSA, AES, ECC, DH, Hash).
 * Eliminates the 5x-duplicated outer Box + title + subtitle + tab bar + scrollable body.
 *
 * @example
 *   <CalculatorHeader
 *     icon={Lock}
 *     title="AES Calculator"
 *     subtitle="AES encryption, decryption, mode analysis, and attacks"
 *     tabs={TABS}
 *     activeTab={tab}
 *     onTabChange={setTab}
 *   >
 *     {tab === 'encrypt-decrypt' && <AESEncryptDecryptTab />}
 *   </CalculatorHeader>
 */
export function CalculatorHeader(props: CalculatorHeaderProps) {
  const { icon: Icon, title, subtitle, children } = props;
  const tabs = 'tabs' in props ? props.tabs : undefined;
  const activeTab = 'activeTab' in props ? props.activeTab : undefined;
  const onTabChange = 'onTabChange' in props ? props.onTabChange : undefined;
  return (
    <Box sx={colFlexSx}>
      <Box sx={{ ...centeredPanelSx, pt: 2, px: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>
          <Typography variant="h3" sx={pageTitleSx}>
            <Icon sx={{ fontSize: 'inherit' }} /> {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={subTitleSx}>
              {subtitle}
            </Typography>
          )}
          {tabs && activeTab !== undefined && onTabChange && (
            <CalculatorSubTabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
          )}
          <Box sx={{ flex: 1, overflow: 'auto', px: 0.5, pt: 1 }}>
            {children}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
