# Plan 017: Add hover state to sidebar category headers

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: visual
- **Planned at**: commit `3009efc`, 2026-06-22

## Why this matters

Category headers ("Factorization", "Partial Key / Lattice", etc.) and "Calculators" header use default MUI hover (barely visible), while their child items have explicit hover backgrounds. This inconsistency makes the interactive affordance unclear.

## Current state

- `Sidebar.tsx:231-236` — Category header `ListItemButton` uses no explicit hover
- `Sidebar.tsx:269-271` — "Calculators" header `ListItemButton` uses no explicit hover
- Child items use `sidebarActiveSx`/`sidebarInactiveSx` with explicit `&:hover`

## Steps

### Step 1: Create a categoryHeaderSx constant

In `Sidebar.tsx`, add:

```ts
const categoryHeaderSx = {
  '&:hover': { backgroundColor: draculaColors.background },
} as const;
```

### Step 2: Apply to category headers

Apply `categoryHeaderSx` to the two category header `ListItemButton`s.

### Step 3: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0

## Done criteria

- [ ] Category headers have visible hover state matching child items
