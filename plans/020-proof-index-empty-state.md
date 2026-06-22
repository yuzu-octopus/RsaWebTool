# Plan 020: Add empty state to ProofIndex search

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
- **Category**: ux
- **Planned at**: commit `3009efc`, 2026-06-22

## Why this matters

When the search filter returns zero results, ProofIndex shows "0 of 47 attacks" with a blank list. No guidance is provided on what to do next. Compare with CommandPalette which shows "No matches for "{query}"."

## Current state

- `ProofIndex.tsx:112-114` — Shows count but no empty state
- `EmptyState` component exists at `src/components/_shared/EmptyState.tsx` — reusable

## Steps

### Step 1: Add EmptyState for zero results

In `src/components/ProofIndex.tsx`, when `filtered.length === 0` and `search` is non-empty, render:

```tsx
<EmptyState
  title={`No proofs match "${search}"`}
  subtitle="Try a different search term or clear the search field"
  icon={<SearchIcon />}
/>
```

Import `EmptyState` from `./_shared/EmptyState` and `SearchIcon` from `@mui/icons-material`.

### Step 2: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0
**Verify**: In browser, search for "xyznonexistent" — should show empty state message

## Done criteria

- [ ] EmptyState appears when search returns zero results
- [ ] EmptyState shows the search query
