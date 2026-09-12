import { useEffect, useState, type ReactNode, type SVGProps } from 'react';
import { SideNav, SideNavItem } from '@astryxdesign/core/SideNav';
import { MobileNav } from '@astryxdesign/core/MobileNav';
import { Badge } from '@astryxdesign/core/Badge';
import { CATEGORIES, attacksByCategory } from '../attacks';
import { CIPHER_ITEMS, MAGIC_ITEM, CIPHER_ATTACK_GROUPS } from '../config/sidebarItems';
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

const SparklesGlyph = makeGlyph(
  <>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
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

/** Icon per cipher id; reused for the cipher nav rows. */
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

import { CATEGORY_BADGE_VARIANTS } from '../config/sidebarItems';

// Native `title` fallback for truncated rows: kit BaseProps omits `title`, but SideNavItem spreads `...rest` onto the button (as `id`/`data-testid` prove).
const nativeTitle = (title: string) => ({ title });


interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function focusWorkspace() {
  requestAnimationFrame(() => document.getElementById('main-workspace')?.focus());
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { selectedAttack, setSelectedAttack, setViewMode, viewMode } = useAppContext();
  const isMobile = useIsMobile();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(
    () => new Set(['cipher:rsa', 'Factorization', 'cipher:aes', 'cipher:ecc', 'cipher:dh', 'cipher:hash']),
  );

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
    setActiveCipherAttack(null);
    setSelectedAttack(attack);
    setViewMode('rsa');
    window.dispatchEvent(new CustomEvent('cipher-workspace-tab', { detail: 'attacks' }));
    focusWorkspace();
  };

  const isAttackActive = (id: string) => viewMode === 'rsa' && selectedAttack?.id === id;

  // Phase-0 mock: Calculator reports the live cipher attack via
  // 'cipher-attack-active' so leaves can light without a context slot.
  const [activeCipherAttack, setActiveCipherAttack] = useState<string | null>(null);
  useEffect(() => {
    const onActive = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setActiveCipherAttack(detail);
    };
    const onSelect = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setActiveCipherAttack(detail);
    };
    window.addEventListener('cipher-attack-active', onActive);
    window.addEventListener('cipher-attack-select', onSelect);
    return () => {
      window.removeEventListener('cipher-attack-active', onActive);
      window.removeEventListener('cipher-attack-select', onSelect);
    };
  }, []);
  const isCipherAttackActive = (cipher: string, id: string) =>
    viewMode === cipher && activeCipherAttack === id;


  const navContent = (
    <>
      <SideNavItem
        key="rsa"
        id="sidebar-view-rsa"
        label="RSA"
        {...nativeTitle('RSA')}
        icon={calcGlyph('rsa')}
        isSelected={viewMode === 'rsa' && !selectedAttack}
        onClick={() => {
          setSelectedAttack(null);
          setViewMode('rsa');
          window.dispatchEvent(new CustomEvent('cipher-workspace-tab', { detail: 'operations' }));
          if (isMobile) onMobileClose();
          focusWorkspace();
        }}
        collapsible={{
          isCollapsed: !expandedCats.has('cipher:rsa'),
          onCollapsedChange: collapsed => setCatCollapsed('cipher:rsa', collapsed),
        }}
        endContent={<Badge label={CATEGORIES.reduce((n, c) => n + (attacksByCategory.get(c) ?? []).length, 0)} variant="neutral" />}
      >
        {CATEGORIES.map(cat => {
          const catAttacks = attacksByCategory.get(cat) ?? [];
          return (
            <SideNavItem
              key={cat}
              label={cat}
              {...nativeTitle(cat)}
              collapsible={{
                isCollapsed: !expandedCats.has(cat),
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
                  {...nativeTitle(attack.name)}
                  size="sm"
                  isSelected={isAttackActive(attack.id)}
                  onClick={() => handleAttackClick(attack)}
                />
              ))}
            </SideNavItem>
          );
        })}
      </SideNavItem>

      {CIPHER_ITEMS.filter(item => item.id !== 'rsa').map(item => {
        const group = CIPHER_ATTACK_GROUPS.find(g => g.cipher === item.id);
        if (!group) {
          return (
            <SideNavItem
              key={item.id}
              id={`sidebar-view-${item.id}`}
              label={item.label}
              {...nativeTitle(item.label)}
              icon={calcGlyph(item.id)}
              isSelected={viewMode === item.id}
              onClick={() => {
                setViewMode(item.id);
                if (isMobile) onMobileClose();
                focusWorkspace();
              }}
            />
          );
        }
        return (
          <SideNavItem
            key={item.id}
            id={`sidebar-view-${item.id}`}
            label={item.label}
            {...nativeTitle(item.label)}
            icon={calcGlyph(item.id)}
            isSelected={viewMode === item.id && activeCipherAttack === null}
            onClick={() => {
              setViewMode(item.id);
              setActiveCipherAttack(null);
              window.dispatchEvent(new CustomEvent('cipher-workspace-tab', { detail: 'attacks' }));
              if (isMobile) onMobileClose();
              focusWorkspace();
            }}
            collapsible={{
              isCollapsed: !expandedCats.has(`cipher:${item.id}`),
              onCollapsedChange: collapsed => setCatCollapsed(`cipher:${item.id}`, collapsed),
            }}
            endContent={<Badge label={group.attacks.length} variant="neutral" />}
          >
            {group.attacks.map(a => (
              <SideNavItem
                key={`${item.id}-${a.id}`}
                id={`sidebar-attack-${item.id}-${a.id}`}
                data-testid={`attack-${item.id}-${a.id}`}
                label={a.label}
                {...nativeTitle(a.label)}
                size="sm"
                isSelected={isCipherAttackActive(item.id, a.id)}
                onClick={() => {
                  setSelectedAttack(null);
                  setViewMode(item.id);
                  if (item.id === 'hash' && a.id !== 'length-ext') {
                    // HMAC / PoW are calculators, not attacks — land on the
                    // operations sub-tab instead of the attacks panel.
                    setActiveCipherAttack(null);
                    window.dispatchEvent(new CustomEvent('cipher-ops-select', { detail: a.id }));
                    window.dispatchEvent(new CustomEvent('cipher-workspace-tab', { detail: 'operations' }));
                  } else {
                    setActiveCipherAttack(a.id);
                    window.dispatchEvent(new CustomEvent('cipher-attack-select', { detail: a.id }));
                    window.dispatchEvent(new CustomEvent('cipher-workspace-tab', { detail: 'attacks' }));
                  }
                  if (isMobile) onMobileClose();
                  focusWorkspace();
                }}
              />
            ))}
          </SideNavItem>
        );
      })}

      <SideNavItem
        key={MAGIC_ITEM.id}
        id={`sidebar-view-${MAGIC_ITEM.id}`}
        label={MAGIC_ITEM.label}
        {...nativeTitle(MAGIC_ITEM.label)}
        icon={SparklesGlyph}
        isSelected={viewMode === MAGIC_ITEM.id}
        onClick={() => {
          setViewMode(MAGIC_ITEM.id);
          if (isMobile) onMobileClose();
          focusWorkspace();
        }}
      />
    </>
  );


  if (isMobile) {
    return (
      <MobileNav
        isOpen={mobileOpen}
        onOpenChange={open => {
          if (!open) onMobileClose();
        }}
        label="Navigation"
        style={{ backgroundColor: 'var(--dracula-bg-dark)' }}
      >
        {navContent}
      </MobileNav>
    );
  }

  return (
    <SideNav
      collapsible
      resizable={{ defaultWidth: 280, minWidth: 200, maxWidth: 480, autoSaveId: 'navPanelWidth' }}
      style={{
        flexShrink: 0,
        // Lets the rail keep its own scrollbar: SideNav's middle zone already
        // scrolls, it only needs a flex bound so it cannot grow the page.
        minHeight: 0,
        backgroundColor: 'var(--dracula-bg-dark)',
        borderRight: '1px solid var(--dracula-selection)',
      }}
    >
      {navContent}
    </SideNav>
  );
}
