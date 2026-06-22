# Plan 021: Unify ghost button fontSize

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: Plan 014 (ICON_SIZES)
- **Category**: visual
- **Planned at**: commit `3009efc`, 2026-06-22

## Why this matters

`ghostBtnSx` uses `fontSize: '0.7rem'` while `colorGhostBtn` uses `fontSize: '0.8rem'`. Both serve the same visual role (outlined ghost buttons) but render at different sizes. When used side-by-side (e.g., InputPanel Generate + Copy buttons), they appear inconsistently sized.

## Current state

- `styles/shared.ts:103` — `ghostBtnSx` has `fontSize: '0.7rem'`
- `styles/shared.ts:117` — `colorGhostBtn` has `fontSize: '0.8rem'`

## Steps

### Step 1: Unify to ICON_SIZES.sm

After Plan 014 creates `ICON_SIZES`, both should use `ICON_SIZES.sm` (0.75rem). If Plan 014 hasn't been executed yet, use the literal value `'0.75rem'`.

### Step 2: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0
**Verify**: In InputPanel, Generate and Copy buttons appear the same size

## Done criteria

- [ ] Both `ghostBtnSx` and `colorGhostBtn` use the same fontSize
