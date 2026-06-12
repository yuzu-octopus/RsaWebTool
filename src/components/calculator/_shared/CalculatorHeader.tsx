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

export interface CalculatorHeaderProps {
  /** Icon component to render next to the title (e.g., `Lock`, `Hub`, `VpnKey`). */
  icon: ElementType;
  /** Page title (h3). */
  title: string;
  /** One-line subtitle shown under the title. */
  subtitle?: string;
  /** Optional sub-tabs (omit for calculators without them, e.g. RSA). */
  tabs?: CalculatorHeaderTab[];
  /** Currently active tab id. Required when `tabs` is provided. */
  activeTab?: string;
  /** Tab change handler. Required when `tabs` is provided. */
  onTabChange?: (id: string) => void;
  /** The active tab's content. */
  children: ReactNode;
}

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
export function CalculatorHeader({
  icon: Icon,
  title,
  subtitle,
  tabs,
  activeTab,
  onTabChange,
  children,
}: CalculatorHeaderProps) {
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
