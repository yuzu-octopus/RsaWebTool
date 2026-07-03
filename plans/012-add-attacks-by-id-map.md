# Plan 012: Add attacksById Map for O(1) lookup

## Status
- Priority: P2
- Effort: S
- Risk: LOW
- Depends on: none
- Category: perf
- Planned at: 08e26cc, 2026-07-03

## Why this matters

attack-worker.ts uses `attacks.find(a => a.id === attackId)` which does a linear scan of 47 elements per message. index.ts already builds `attacksByCategory` as a Map but has no equivalent for ID lookup.

## Current state

- `src/attacks/index.ts:141-144`: `attacksByCategory` Map built at module scope
- `src/workers/attack-worker.ts:122`: `attacks.find(a => a.id === attackId)` — linear scan

## Commands

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Typecheck | `bun run typecheck`| exit 0   |

## Steps

### Step 1: Add attacksById Map to index.ts

After the attacksByCategory Map definition, add:

```typescript
export const attacksById = new Map(attacks.map(a => [a.id, a]));
```

### Step 2: Update attack-worker.ts to use the Map

Change the linear find to:
```typescript
const attack = attacksById.get(attackId);
```

### Step 3: Verify

- `bun run typecheck` passes
- The worker still resolves attacks correctly

## Done criteria

- [ ] attacksById Map exists in index.ts
- [ ] attack-worker.ts uses attacksById.get() instead of .find()
- [ ] bun run typecheck exits 0
