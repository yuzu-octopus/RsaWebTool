import { useState, useEffect, useMemo, useCallback, startTransition } from 'react';
import {
  CommandPalette as AstryxCommandPalette,
  CommandPaletteInput,
} from '@astryxdesign/core/CommandPalette';
import { Badge } from '@astryxdesign/core/Badge';
import { Text } from '@astryxdesign/core/Text';
import { Stack } from '@astryxdesign/core/Stack';
import type { SearchableItem, SearchSource } from '@astryxdesign/core/Typeahead';
import { useAppContext } from '../hooks/useAppContext';
import { attacks } from '../attacks';
import { SIDEBAR_MODULES, ALL_SIDEBAR_ITEMS } from '../config/sidebarItems';
import type { Attack, AttackCategory, CalculatorMode } from '../types';

// Badge color variants follow brand semantics: tinted color variants for
// category tags, never the loud solid status variants (success/warning/error
// are reserved for system state demanding attention).
const CATEGORY_BADGE_VARIANTS: Record<AttackCategory, 'green' | 'purple' | 'cyan' | 'orange' | 'yellow' | 'pink'> = {
  Factorization: 'green',
  'Partial Key / Lattice': 'purple',
  'Message / Protocol': 'cyan',
  Oracle: 'orange',
  Advanced: 'yellow',
  Symmetric: 'pink',
  Hash: 'cyan',
  ECC: 'purple',
};

const VIEW_MODES = ['attack', 'magic', 'proofs', 'calculator', 'format-converter', 'instructions', 'pem'] as const;
type ViewMode = typeof VIEW_MODES[number];

interface PaletteAux {
  group: 'Modules' | 'Calculators' | 'Attacks';
  kind: 'view' | 'attack' | 'calculator-tab';
  mode?: string;
  moduleId?: string;
  calculatorMode?: CalculatorMode;
  attack?: Attack;
  keywords: string[];
}

type PaletteEntry = SearchableItem<PaletteAux>;

/**
 * Two orders, matching the previous behavior exactly: the palette opens on
 * modules, then calculator tabs, then attacks; once a query is typed,
 * results follow sidebar order (attacks by category, calculators, modules).
 */
function buildEntries(): { bootstrap: PaletteEntry[]; sidebar: PaletteEntry[] } {
  const attacksMap = new Map(attacks.map(a => [a.id, a]));
  const modulesMap = new Map(SIDEBAR_MODULES.map(m => [m.id, m]));
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
    } else if (item.type === 'calculator-tab') {
      entries.push({
        id: `calc-${item.calculatorMode}`,
        label: item.label,
        auxiliaryData: {
          group: 'Calculators',
          kind: 'calculator-tab',
          calculatorMode: item.calculatorMode,
          keywords: [item.calculatorMode, item.id],
        },
      });
    } else {
      const mod = modulesMap.get(item.id);
      if (!mod) continue;
      entries.push({
        id: `view-${mod.mode}`,
        label: mod.label,
        auxiliaryData: {
          group: 'Modules',
          kind: 'view',
          mode: mod.mode,
          moduleId: mod.id,
          keywords: [mod.mode, mod.id],
        },
      });
    }
  }

  const rank = (group: PaletteAux['group']) =>
    group === 'Modules' ? 0 : group === 'Calculators' ? 1 : 2;
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
    setViewMode,
    setSelectedAttack,
    setCalculatorMode,
  } = useAppContext();
  const [query, setQuery] = useState('');

  // Reset the query when the palette opens.
  useEffect(() => {
    if (commandPaletteOpen) {
      startTransition(() => {
        setQuery('');
      });
    }
  }, [commandPaletteOpen]);

  const { bootstrap, sidebar } = useMemo(() => buildEntries(), []);
  const entryById = useMemo(() => new Map(sidebar.map(e => [e.id, e])), [sidebar]);

  // Custom source (instead of createStaticSource) to preserve the previous
  // ordering contract: grouped modules/calculators/attacks when empty,
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
        setViewMode(mode as ViewMode);
      }
    },
    [setViewMode],
  );

  const selectCalculatorTab = useCallback(
    (calculatorMode: CalculatorMode) => {
      setViewMode('calculator');
      setCalculatorMode(calculatorMode);
    },
    [setViewMode, setCalculatorMode],
  );

  const selectAttack = useCallback(
    (attack: Attack) => {
      setSelectedAttack(attack);
      setViewMode('attack');
    },
    [setSelectedAttack, setViewMode],
  );

  const handleValueChange = useCallback(
    (value: string) => {
      const entry = entryById.get(value);
      if (!entry?.auxiliaryData) return;
      const aux = entry.auxiliaryData;
      if (aux.kind === 'view' && aux.mode) selectView(aux.mode);
      else if (aux.kind === 'calculator-tab' && aux.calculatorMode) selectCalculatorTab(aux.calculatorMode);
      else if (aux.kind === 'attack' && aux.attack) selectAttack(aux.attack);
    },
    [entryById, selectView, selectCalculatorTab, selectAttack],
  );

  const renderItem = useCallback((item: PaletteEntry) => {
    const aux = item.auxiliaryData!;
    const chips: { label: string; variant: 'neutral' | 'blue' | 'cyan' | 'green' | 'orange' | 'pink' | 'purple' | 'yellow' }[] = [];
    let secondary: string | undefined;
    if (aux.kind === 'view') {
      chips.push({ label: 'Module', variant: 'neutral' });
    } else if (aux.kind === 'calculator-tab') {
      chips.push({ label: 'Calculator', variant: 'cyan' });
    } else if (aux.attack) {
      secondary = aux.attack.id;
      chips.push({ label: aux.attack.category, variant: CATEGORY_BADGE_VARIANTS[aux.attack.category] });
      chips.push({
        label: aux.attack.frontendCheck ? 'Local' : 'SageMath',
        variant: aux.attack.frontendCheck ? 'green' : 'orange',
      });
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
          placeholder="Search attacks, calculators, and views..."
          label="Search commands"
          value={query}
          onValueChange={setQuery}
        />
      }
      emptySearchText={query.trim() ? `No matches for "${query}"` : 'No commands available'}
      label="Command palette"
      width={480}
      maxHeight={400}
      onValueChange={handleValueChange}
    />
  );
}
