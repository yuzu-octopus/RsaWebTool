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
      description={`[${attack.category}] ${attack.description}`}
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

  const handleClick = useCallback((attack: typeof attacks[0]) => {
    setSelectedAttack(attack);
    setViewMode('attack');
  }, [setSelectedAttack, setViewMode]);

  const attackItems = useMemo(() =>
    filtered.map(attack => (
      <AttackListItem key={attack.id} attack={attack} onClick={handleClick} />
    )),
    [filtered, handleClick],
  );

  if (viewMode !== 'proofs') return null;

  return (
    <Stack>
      <Stack hAlign="center" padding={2}>
        <Stack width="100%" maxWidth={640} gap={2}>
          <Heading level={3}>Attack Index</Heading>

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

          <Text type="supporting">
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
          <Stack width="100%" maxWidth={640} padding={2}>
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
