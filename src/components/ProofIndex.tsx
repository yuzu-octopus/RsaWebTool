import { useState, useMemo, useCallback } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { List, ListItem } from '@astryxdesign/core/List';
import { Badge } from '@astryxdesign/core/Badge';
import { Divider } from '@astryxdesign/core/Divider';
import { useAppContext } from '../hooks/useAppContext';
import { attacks } from '../attacks';
import { EmptyState } from './_shared/EmptyState';

function AttackListItem({
  attack,
  onClick,
}: {
  attack: typeof attacks[0];
  onClick: (attack: typeof attacks[0]) => void;
}) {
  return (
    <ListItem
      label={attack.name}
      description={
        <Text type="body" maxLines={2}>
          {`[${attack.category}] ${attack.description}`}
        </Text>
      }
      endContent={
        <Badge
          variant={attack.frontendCheck ? 'green' : 'orange'}
          label={attack.frontendCheck ? 'Local' : 'SageMath'}
        />
      }
      onClick={() => onClick(attack)}
    />
  );
}

export function ProofIndex() {
  const { viewMode, setSelectedAttack, setViewMode } = useAppContext();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    attacks.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
    ),
    [search]
  );

  const handleSelectAttack = useCallback((attack: typeof attacks[0]) => {
    setSelectedAttack(attack);
    setViewMode('attack');
  }, [setSelectedAttack, setViewMode]);

  const attackItems = useMemo(() =>
    filtered.map(attack => (
      <AttackListItem key={attack.id} attack={attack} onClick={handleSelectAttack} />
    )),
    [filtered, handleSelectAttack],
  );

  if (viewMode !== 'proofs') return null;

  return (
    <Stack style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
      <Stack hAlign="center" padding={4}>
        <Stack width="100%" maxWidth={640} gap={2}>
          <Heading level={3} color="accent">Attack Index</Heading>

          <TextInput
            label="Search proofs"
            isLabelHidden
            placeholder="Search proofs..."
            startIcon="search"
            hasClear
            value={search}
            onChange={(value) => setSearch(value)}
            width="100%"
          />

          <Text type="body" color="secondary" hasTabularNumbers>
            {filtered.length} of {attacks.length} attacks
          </Text>
        </Stack>
      </Stack>

      <Divider />

      <Stack hAlign="center" isScrollable>
        {filtered.length === 0 && search ? (
          <EmptyState
            title={`No proofs match "${search}"`}
            hint="Try a different search term or clear the search field"
          />
        ) : (
          <Stack width="100%" maxWidth={640} padding={3}>
            <List hasDividers>
              {attackItems}
            </List>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}

export default ProofIndex;
