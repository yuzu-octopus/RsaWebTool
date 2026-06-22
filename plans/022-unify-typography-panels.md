# Plan 022: Unify typography sizing across panels

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: visual
- **Planned at**: commit `3009efc`, 2026-06-22

## Why this matters

Heading styles vary across panels: some h5 headings are bold, some are not; the gap between icon and title varies (1 vs 2); some panels use inline fontSize overrides while others rely on MUI variant defaults.

## Current state

- `InputPanel.tsx:176` — h5 with no explicit fontWeight
- `InstructionsPanel.tsx:93-99` — h5 with `fontWeight: 700`
- `ProofIndex.tsx:98` — h3 with `gap: 2` (others use `gap: 1`)
- `OutputPanel.tsx:143` — h5 "Results" at default weight
- `CalculatorHeader.tsx:72-73` — uses `pageTitleSx` (shared h3)

## Steps

### Step 1: Create shared heading styles in shared.ts

Add to `src/styles/shared.ts`:

```ts
export const panelTitleSx = {
  color: draculaColors.purple,
  fontWeight: 700,
  mb: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 1,
} as const;
```

### Step 2: Apply to panels

Replace ad-hoc h3/h5 title styling in:
- `ProofIndex.tsx:98` — use `panelTitleSx` (fixes gap: 2 → gap: 1)
- `OutputPanel.tsx:143` — use `panelTitleSx`
- `InstructionsPanel.tsx:93-99` — use `panelTitleSx`

### Step 3: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0

## Done criteria

- [ ] All panel titles use consistent styling from shared constants
- [ ] No panel title has a unique gap value (all use gap: 1)
