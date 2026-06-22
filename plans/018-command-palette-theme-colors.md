# Plan 018: Fix hardcoded colors in CommandPalette

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
- **Category**: tech-debt
- **Planned at**: commit `3009efc`, 2026-06-22

## Why this matters

`CommandPalette.tsx` uses hardcoded `'#282a36'` instead of `draculaColors.background` in 3 places. One also uses `!important`. If the Dracula palette is ever customized, these will be visually orphaned.

## Current state

- `CommandPalette.tsx:280` — `bgcolor: '#282a36 !important'`
- `CommandPalette.tsx:293` — `bgcolor: '#282a36'`
- `CommandPalette.tsx:325` — `bgcolor: '#282a36'`

## Steps

### Step 1: Replace hardcoded colors

Replace all 3 occurrences of `'#282a36'` with `draculaColors.background`.

### Step 2: Remove !important

Remove the `!important` flag from line 280.

### Step 3: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0

## Done criteria

- [ ] No hardcoded `#282a36` in CommandPalette.tsx
- [ ] No `!important` flags in CommandPalette sx
