# Plan 014: Centralize icon fontSize in shared scale constants

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 3009efc..HEAD -- src/styles/shared.ts src/components/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: visual
- **Planned at**: commit `3009efc`, 2026-06-22

## Why this matters

Icons across the codebase use at least 8 different fontSize values: '0.65rem', '0.7rem', '0.75rem', '0.85rem', '0.9rem', '1rem', '1.1rem', '2rem', and numeric `20` (px). This creates inconsistent visual weight and makes it impossible to scale icons uniformly.

## Current state

- `Sidebar.tsx:216` — `fontSize: '2rem'` (header icon)
- `Sidebar.tsx:34-38` — `fontSize: '1.1rem'` (module icons)
- `Sidebar.tsx:240,277` — `fontSize: '1rem'` (expand icons)
- `Sidebar.tsx:344,358` — `fontSize: '0.9rem'` (status icons)
- `CommandPalette.tsx:93` — `fontSize: 20` (numeric px!)
- `EmptyState.tsx:70` — `fontSize: '2.5rem'`
- `PemDecryptor.tsx:346` — `fontSize: '0.65rem'`
- `ProofIndex.tsx:32-33` — `fontSize: '0.85rem'`
- `ghostBtnSx` in `shared.ts:103` — `fontSize: '0.7rem'`
- `colorGhostBtn` in `shared.ts:117` — `fontSize: '0.8rem'`

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/styles/shared.ts` — add ICON_SIZES constant
- All files that use icon fontSize — update to use constants

**Out of scope**:
- Font sizes for text (Typography components) — separate concern
- The favicon SVG — managed in plan 013

## Steps

### Step 1: Add ICON_SIZES constant to shared.ts

In `src/styles/shared.ts`, add near the top (after `MONO_FAMILY`):

```ts
export const ICON_SIZES = {
  xs: '0.65rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.25rem',
  xl: '2rem',
} as const;
```

### Step 2: Update ghostBtnSx and colorGhostBtn

In `src/styles/shared.ts`:
- `ghostBtnSx` (line 103): change `fontSize: '0.7rem'` → `fontSize: ICON_SIZES.sm`
- `colorGhostBtn` (line 117): change `fontSize: '0.8rem'` → `fontSize: ICON_SIZES.sm`

This also fixes VISUAL-11 (ghost button size mismatch) by unifying both to 0.75rem.

### Step 3: Update Sidebar icon sizes

In `src/components/Sidebar.tsx`, replace ad-hoc fontSize values with `ICON_SIZES` constants:
- Header icon: `'2rem'` → `ICON_SIZES.xl`
- Module icons: `'1.1rem'` → `ICON_SIZES.lg`
- Expand icons: `'1rem'` → `ICON_SIZES.md`
- Status icons: `'0.9rem'` → `ICON_SIZES.sm`

### Step 4: Fix CommandPalette px to rem

In `src/components/CommandPalette.tsx`:
- Line 93: `fontSize: 20` → `fontSize: ICON_SIZES.lg` (import ICON_SIZES)
- Line 308: `fontSize: 20` → `fontSize: ICON_SIZES.lg`

### Step 5: Update other components

Update remaining ad-hoc icon fontSize values:
- `PemDecryptor.tsx:346`: `'0.65rem'` → `ICON_SIZES.xs`
- `ProofIndex.tsx:32-33`: `'0.85rem'` → `ICON_SIZES.sm`
- `EmptyState.tsx:70`: `'2.5rem'` → keep as-is (intentionally oversized for empty states)

### Step 6: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0
**Verify**: `grep -r "fontSize:" src/components/ | grep -v "ICON_SIZES\|variant\|0\.8rem\|Typography\|0\.75rem\|0\.65rem\|1\.05rem\|0\.7rem"` — no remaining ad-hoc icon fontSize values (some may remain for Typography, that's OK)

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `ICON_SIZES` constant exists in `shared.ts`
- [ ] `ghostBtnSx` and `colorGhostBtn` use `ICON_SIZES.sm`
- [ ] CommandPalette uses rem-based fontSize
- [ ] No icon components use hardcoded fontSize (only Typography variants may)

## STOP conditions

- Any icon appears visually broken after the fontSize change
- `ICON_SIZES` values don't match the visual weight of the original values

## Maintenance notes

- New components should always import from `ICON_SIZES` instead of hardcoding fontSize
- The `lg` size (1.25rem) matches MUI's default icon size — use for nav items
- The `xl` size (2rem) is for hero/header icons only
