import { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import {
  CommandPalette as AstryxCommandPalette,
  CommandPaletteInput,
} from '@astryxdesign/core/CommandPalette';
import { Badge } from '@astryxdesign/core/Badge';
import { Text } from '@astryxdesign/core/Text';
import { Stack } from '@astryxdesign/core/Stack';
import { Icon } from '@astryxdesign/core/Icon';
import type { SearchableItem, SearchSource } from '@astryxdesign/core/Typeahead';
import { useAppContext } from '../hooks/useAppContext';
import { attacks } from '../attacks';
import { ALL_SIDEBAR_ITEMS, CATEGORY_BADGE_VARIANTS, CIPHER_ATTACK_GROUPS, CIPHER_ITEMS } from '../config/sidebarItems';
import type { Attack } from '../types';


const VIEW_MODES = ['rsa', 'aes', 'ecc', 'hash', 'dh', 'magic'] as const;
type ViewMode = typeof VIEW_MODES[number];

interface PaletteAux {
  group: 'Modules' | 'Ciphers' | 'Attacks';
  kind: 'view' | 'attack' | 'cipher-attack';
  mode?: string;
  moduleId?: string;
  attack?: Attack;
  cipherAttack?: string;
  keywords: string[];
}

type PaletteEntry = SearchableItem<PaletteAux>;

/**
 * Two orders: the palette opens on modules, then cipher views, then attacks;
 * once a query is typed, results follow sidebar order (ciphers, attacks by
 * category, Magic Panel).
 */
function buildEntries(): { bootstrap: PaletteEntry[]; sidebar: PaletteEntry[] } {
  const attacksMap = new Map(attacks.map(a => [a.id, a]));
  const entries: PaletteEntry[] = [];

  for (const item of ALL_SIDEBAR_ITEMS) {
    if (item.type === 'attack') {
      const attack = attacksMap.get(item.id);
      if (!attack) continue;
      entries.push({
        id: attack.id,
        label: attack.name,
        auxiliaryData: {
          group: 'Attacks',
          kind: 'attack',
          attack,
          keywords: [attack.id, attack.category],
        },
      });
    } else if (item.type === 'cipher') {
      entries.push({
        id: `view-${item.id}`,
        label: item.label,
        auxiliaryData: {
          group: 'Ciphers',
          kind: 'view',
          mode: item.id,
          moduleId: item.id,
          keywords: [item.id, item.label],
        },
      });
    } else if (item.type === 'cipher-attack') {
      const group = CIPHER_ATTACK_GROUPS.find(g => g.cipher === item.cipher);
      const label = group?.attacks.find(a => a.id === item.id)?.label ?? item.id;
      entries.push({
        id: `${item.cipher}-${item.id}`,
        label,
        auxiliaryData: {
          group: 'Ciphers',
          kind: 'cipher-attack',
          mode: item.cipher,
          moduleId: item.cipher,
          cipherAttack: item.id,
          keywords: [item.id, label, item.cipher],
        },
      });
    } else {
      entries.push({
        id: `view-${item.id}`,
        label: item.label,
        auxiliaryData: {
          group: 'Modules',
          kind: 'view',
          mode: item.id,
          moduleId: item.id,
          keywords: [item.id, item.label],
        },
      });
    }
  }

  const rank = (group: PaletteAux['group']) =>
    group === 'Modules' ? 0 : group === 'Ciphers' ? 1 : 2;
  return {
    bootstrap: entries.toSorted(
      (a, b) => rank(a.auxiliaryData!.group) - rank(b.auxiliaryData!.group),
    ),
    sidebar: entries,
  };
}

function matchesQuery(entry: PaletteEntry, q: string): boolean {
  if (!q) return true;
  if (entry.label.toLowerCase().includes(q)) return true;
  return entry.auxiliaryData!.keywords.some(kw => kw.toLowerCase().includes(q));
}

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    viewMode,
    setViewMode,
    selectedAttack,
    setSelectedAttack,
  } = useAppContext();
  const [query, setQuery] = useState('');

  // Mirror Sidebar: Calculator reports the live cipher attack via
  // 'cipher-attack-active' so the current mark stays correct no matter
  // which surface (sidebar or palette) selected it.
  const [activeCipherAttack, setActiveCipherAttack] = useState<string | null>(null);
  useEffect(() => {
    const onActive = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (typeof detail === 'string') setActiveCipherAttack(detail);
    };
    window.addEventListener('cipher-attack-active', onActive);
    window.addEventListener('cipher-attack-select', onActive);
    return () => {
      window.removeEventListener('cipher-attack-active', onActive);
      window.removeEventListener('cipher-attack-select', onActive);
    };
  }, []);

  // Reset the query when the palette opens.
  useEffect(() => {
    if (commandPaletteOpen) {
      startTransition(() => {
        setQuery('');
      });
    }
  }, [commandPaletteOpen]);

  // Rebuild when the attack registry changes so newly added attacks appear.
  const { bootstrap, sidebar } = useMemo(() => buildEntries(), [attacks]);
  const entryById = useMemo(() => new Map(sidebar.map(e => [e.id, e])), [sidebar]);

  // Entry id matching the current workspace: RSA attack, active cipher
  // attack, or cipher/module view. Passed as the controlled value so the
  // kit marks the current row (aria-selected + our check mark).
  const currentValue = selectedAttack?.id
    ?? (activeCipherAttack ? `${viewMode}-${activeCipherAttack}` : `view-${viewMode}`);

  // Custom source (instead of createStaticSource) to preserve the previous
  // ordering contract: grouped modules/ciphers/attacks when empty,
  // sidebar order when filtering. Substring matching covers the label plus
  // the id/category/mode keywords, as before.
  const searchSource = useMemo<SearchSource<PaletteEntry>>(
    () => ({
      search: rawQuery => {
        const q = rawQuery.toLowerCase().trim();
        if (!q) return bootstrap;
        return sidebar.filter(e => matchesQuery(e, q));
      },
      bootstrap: () => bootstrap,
    }),
    [bootstrap, sidebar],
  );

  const selectView = useCallback(
    (mode: string) => {
      if (VIEW_MODES.includes(mode as ViewMode)) {
        setActiveCipherAttack(null);
        setViewMode(mode as ViewMode);
      }
    },
    [setViewMode],
  );

  const selectAttack = useCallback(
    (attack: Attack) => {
      setActiveCipherAttack(null);
      setSelectedAttack(attack);
      setViewMode('rsa');
      window.dispatchEvent(new CustomEvent('cipher-workspace-tab', { detail: 'attacks' }));
    },
    [setSelectedAttack, setViewMode],
  );

  const handleValueChange = useCallback(
    (value: string) => {
      const entry = entryById.get(value);
      if (!entry?.auxiliaryData) return;
      const aux = entry.auxiliaryData;
      if (aux.kind === 'view' && aux.mode) selectView(aux.mode);
      else if (aux.kind === 'attack' && aux.attack) selectAttack(aux.attack);
      else if (aux.kind === 'cipher-attack' && aux.mode && aux.cipherAttack) {
        setActiveCipherAttack(aux.cipherAttack);
        setSelectedAttack(null);
        setViewMode(aux.mode as ViewMode);
        window.dispatchEvent(new CustomEvent('cipher-attack-select', { detail: aux.cipherAttack }));
        window.dispatchEvent(new CustomEvent('cipher-workspace-tab', { detail: 'attacks' }));
      }
    },
    [entryById, selectView, selectAttack, setSelectedAttack, setViewMode],
  );

  const renderItem = useCallback((item: PaletteEntry, isSelected: boolean) => {
    const aux = item.auxiliaryData!;
    const chips: { label: string; variant: 'neutral' | 'blue' | 'cyan' | 'green' | 'orange' | 'pink' | 'purple' | 'yellow' }[] = [];
    let secondary: string | undefined;
    if (aux.kind === 'view' && aux.group === 'Ciphers') {
      chips.push({ label: 'Cipher', variant: 'cyan' });
    } else if (aux.kind === 'view') {
      chips.push({ label: 'Module', variant: 'neutral' });
    } else if (aux.attack) {
      secondary = aux.attack.id;
      chips.push({ label: aux.attack.category, variant: CATEGORY_BADGE_VARIANTS[aux.attack.category] });
      chips.push({
        label: aux.attack.frontendCheck ? 'Local' : 'SageMath',
        variant: aux.attack.frontendCheck ? 'green' : 'orange',
      });
    } else if (aux.kind === 'cipher-attack' && aux.mode && aux.cipherAttack) {
      secondary = aux.cipherAttack;
      const cipherLabel = CIPHER_ITEMS.find(c => c.id === aux.mode)?.label ?? aux.mode;
      chips.push({ label: cipherLabel, variant: CATEGORY_BADGE_VARIANTS[cipherLabel] ?? 'neutral' });
      // Cipher attack lists mark Sage-backed entries with a "— SageCell"
      // suffix; everything else runs locally in the browser.
      const isSage = item.label.includes('SageCell');
      chips.push({ label: isSage ? 'SageMath' : 'Local', variant: isSage ? 'orange' : 'green' });
    }
    return (
      <Stack
        direction="horizontal"
        gap={2}
        vAlign="center"
        width="100%"
        data-testid={`command-palette-option-${item.id}`}
      >
        <Stack direction="vertical" gap={1}>
          <Text type="body">{item.label}</Text>
          {secondary && <Text type="body">{secondary}</Text>}
        </Stack>
        <Stack direction="horizontal" gap={1} vAlign="center">
          {chips.map(chip => (
            <Badge key={chip.label} label={chip.label} variant={chip.variant} />
          ))}
        </Stack>
        {isSelected && <Icon icon="check" size="sm" color="success" />}
      </Stack>
    );
  }, []);

  return (
    <AstryxCommandPalette
      isOpen={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      searchSource={searchSource}
      renderItem={renderItem}
      input={
        <CommandPaletteInput
          placeholder="Search attacks, ciphers, and views..."
          label="Search commands"
          value={query}
          onValueChange={setQuery}
        />
      }
      emptySearchText={query.trim() ? `No matches for "${query}"` : 'No commands available'}
      label="Command palette"
      width={480}
      maxHeight={400}
      value={currentValue}
      onValueChange={handleValueChange}
    />
  );
}
