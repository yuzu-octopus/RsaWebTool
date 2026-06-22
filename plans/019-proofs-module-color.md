# Plan 019: Assign distinct color to Proofs module in sidebar

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

The "Attack Index" / "Proofs" sidebar item uses `draculaColors.foreground` (white), breaking the color-coding pattern that gives each module visual identity (green for Instructions, purple for Magic, orange for Converter, yellow for PEM).

## Current state

- `Sidebar.tsx:312` — `proofs: draculaColors.foreground` (white)
- Other modules: Instructions=green, Magic=purple, Converter=orange, PEM=yellow

## Steps

### Step 1: Assign a distinct color

Change `proofs` from `draculaColors.foreground` to `draculaColors.cyan` — this matches the ProofRenderer's KaTeX math rendering theme and provides visual contrast.

### Step 2: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0
**Verify**: The Attack Index sidebar item now appears in cyan, not white

## Done criteria

- [ ] "Attack Index" sidebar item uses cyan color instead of white
