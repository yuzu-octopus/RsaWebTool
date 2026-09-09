import { useEffect, useState, type ReactNode, type SVGProps } from 'react';
import { SideNav, SideNavHeading, SideNavItem } from '@astryxdesign/core/SideNav';
import { MobileNav } from '@astryxdesign/core/MobileNav';
import { Badge } from '@astryxdesign/core/Badge';
import { Text } from '@astryxdesign/core/Text';
import { Link } from '@astryxdesign/core/Link';
import { Divider } from '@astryxdesign/core/Divider';
import { Stack } from '@astryxdesign/core/Stack';
import { LogoIcon } from './_shared/LogoIcon';
import { CATEGORIES, attacksByCategory } from '../attacks';
import { CALCULATOR_ITEMS, SIDEBAR_MODULES } from '../config/sidebarItems';
import type { Attack } from '../types';
import { useAppContext } from '../hooks/useAppContext';

/** Matches the previous MUI breakpoint: temporary drawer below, rail at/above. */
const MOBILE_MEDIA_QUERY = '(max-width:599.95px)';

/** Shared by App (mobile TopNav) and Sidebar (rail vs drawer). */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

// ─── Glyphs ─────────────────────────────────────────────────────────────
// lucide-react is not a dependency (and package.json is frozen), so nav
// artwork is small currentColor stroke glyphs. They satisfy SideNavItem's
// IconType (semantic name | SVG component) via the component branch; size
// is inherited with 1em so the nav theme controls the rendered size.

type GlyphProps = SVGProps<SVGSVGElement>;

function makeGlyph(paths: ReactNode) {
  return function NavGlyph(props: GlyphProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

const BookGlyph = makeGlyph(
  <>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13z" />
    <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
  </>,
);
const SparklesGlyph = makeGlyph(
  <>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
  </>,
);
const SwapGlyph = makeGlyph(
  <>
    <path d="M8 3L4 7l4 4" />
    <path d="M4 7h16" />
    <path d="M16 21l4-4-4-4" />
    <path d="M20 17H4" />
  </>,
);
const KeyGlyph = makeGlyph(
  <>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="M11 12l9-9" />
    <path d="M17 4l3 3" />
    <path d="M14 7l2.5 2.5" />
  </>,
);
const LockGlyph = makeGlyph(
  <>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </>,
);
const NetworkGlyph = makeGlyph(
  <>
    <circle cx="12" cy="5" r="2.5" />
    <circle cx="5" cy="19" r="2.5" />
    <circle cx="19" cy="19" r="2.5" />
    <path d="M12 7.5v5" />
    <path d="M10.5 14.5l-3.5 3" />
    <path d="M13.5 14.5l3.5 3" />
  </>,
);
const TagGlyph = makeGlyph(
  <>
    <path d="M20.6 13.4L12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
    <circle cx="7.5" cy="7.5" r="1.5" />
  </>,
);
const ShieldGlyph = makeGlyph(
  <>
    <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
  </>,
);

function modGlyph(id: string) {
  switch (id) {
    case 'instructions':
    case 'proofs':
      return BookGlyph;
    case 'magic':
      return SparklesGlyph;
    case 'format-converter':
      return SwapGlyph;
    case 'pem':
      return KeyGlyph;
    default:
      return BookGlyph;
  }
}

function calcGlyph(mode: string) {
  switch (mode) {
    case 'rsa':
      return KeyGlyph;
    case 'aes':
      return LockGlyph;
    case 'ecc':
      return NetworkGlyph;
    case 'hash':
      return TagGlyph;
    case 'dh':
      return ShieldGlyph;
    default:
      return KeyGlyph;
  }
}

/** Tinted count badges per attack category (mirrors the command palette). */
const CATEGORY_BADGE_VARIANTS: Record<string, 'green' | 'purple' | 'cyan' | 'orange' | 'yellow'> = {
  Factorization: 'green',
  'Partial Key / Lattice': 'purple',
  'Message / Protocol': 'cyan',
  Oracle: 'orange',
  Advanced: 'yellow',
};

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function focusWorkspace() {
  requestAnimationFrame(() => document.getElementById('main-workspace')?.focus());
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { selectedAttack, setSelectedAttack, setViewMode, viewMode, calculatorMode, setCalculatorMode } = useAppContext();
  const isMobile = useIsMobile();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(() => new Set([CATEGORIES[0], 'Calculators']));
  const activeExpandedCats = selectedAttack
    ? new Set(expandedCats).add(selectedAttack.category)
    : expandedCats;

  const setCatCollapsed = (cat: string, collapsed: boolean) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (collapsed) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  const handleAttackClick = (attack: Attack) => {
    if (isMobile) onMobileClose();
    setSelectedAttack(attack);
    setViewMode('attack');
    focusWorkspace();
  };

  const isAttackActive = (id: string) => viewMode === 'attack' && selectedAttack?.id === id;
  const isViewActive = (mode: string) => viewMode === mode;

  const heading = (
    <SideNavHeading
      heading="RSA CTF Tool"
      subheading="SageMath Powered"
      icon={<LogoIcon size={32} />}
    />
  );

  const footer = (
    <Stack direction="vertical" gap={1} padding={2}>
      <Divider />
      <Text type="supporting">© 2026 yuzu-octopus</Text>
      <Text type="supporting">
        Powered by{' '}
        <Link href="https://pages.github.com" target="_blank" rel="noopener">
          GitHub Pages
        </Link>
      </Text>
      <Text type="supporting">
        Made with{' '}
        <Link href="https://vite.dev" target="_blank" rel="noopener">
          Vite
        </Link>
      </Text>
    </Stack>
  );

  const navContent = (
    <>
      {CATEGORIES.map(cat => {
        const catAttacks = attacksByCategory.get(cat) ?? [];
        return (
          <SideNavItem
            key={cat}
            label={cat}
            collapsible={{
              isCollapsed: !activeExpandedCats.has(cat),
              onCollapsedChange: collapsed => setCatCollapsed(cat, collapsed),
            }}
            endContent={<Badge label={catAttacks.length} variant={CATEGORY_BADGE_VARIANTS[cat] ?? 'neutral'} />}
          >
            {catAttacks.map(attack => (
              <SideNavItem
                key={attack.id}
                id={`sidebar-attack-${attack.id}`}
                data-testid={`attack-${attack.id}`}
                label={attack.name}
                size="sm"
                isSelected={isAttackActive(attack.id)}
                onClick={() => handleAttackClick(attack)}
              />
            ))}
          </SideNavItem>
        );
      })}

      <SideNavItem
        label="Calculators"
        collapsible={{
          isCollapsed: !expandedCats.has('Calculators'),
          onCollapsedChange: collapsed => setCatCollapsed('Calculators', collapsed),
        }}
        endContent={<Badge label={CALCULATOR_ITEMS.length} variant="blue" />}
      >
        {CALCULATOR_ITEMS.map(item => (
          <SideNavItem
            key={item.id}
            id={`sidebar-calc-${item.calculatorMode}`}
            label={item.label}
            icon={calcGlyph(item.calculatorMode)}
            isSelected={viewMode === 'calculator' && calculatorMode === item.calculatorMode}
            onClick={() => {
              setViewMode('calculator');
              setCalculatorMode(item.calculatorMode);
              if (isMobile) onMobileClose();
              focusWorkspace();
            }}
          />
        ))}
      </SideNavItem>

      {SIDEBAR_MODULES.map(mod => (
        <SideNavItem
          key={mod.id}
          id={`sidebar-view-${mod.mode}`}
          label={mod.label}
          icon={modGlyph(mod.id)}
          isSelected={isViewActive(mod.mode)}
          onClick={() => {
            setViewMode(mod.mode as 'attack' | 'magic' | 'proofs' | 'calculator' | 'format-converter' | 'instructions' | 'pem');
            if (isMobile) onMobileClose();
            focusWorkspace();
          }}
        />
      ))}
    </>
  );

  if (isMobile) {
    return (
      <MobileNav
        isOpen={mobileOpen}
        onOpenChange={open => {
          if (!open) onMobileClose();
        }}
        header={heading}
        label="Navigation"
      >
        {navContent}
        {footer}
      </MobileNav>
    );
  }

  return (
    <SideNav
      header={heading}
      footer={footer}
      style={{
        width: 264,
        flexShrink: 0,
        backgroundColor: 'var(--dracula-selection)',
        borderRight: '1px solid var(--dracula-comment)',
      }}
    >
      {navContent}
    </SideNav>
  );
}
