# Plan 016: Add focus-visible outline to sidebar items

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: accessibility
- **Planned at**: commit `3009efc`, 2026-06-22

## Why this matters

Keyboard-only users cannot see which sidebar item is focused. The `ghostBtnSx` and `colorGhostBtn` in `styles/shared.ts` already define `&:focus-visible` outlines, but the sidebar items lack them. This violates WCAG 2.1 SC 2.4.7.

## Current state

- `styles/shared.ts:105-108` — `ghostBtnSx` has `&:focus-visible: { outline: '2px solid cyan', outlineOffset: 2 }`
- `Sidebar.tsx:250-255` — Attack `ListItemButton` has no `&:focus-visible`
- `Sidebar.tsx:285-293` — Calculator `ListItemButton` has no `&:focus-visible`
- `Sidebar.tsx:315-322` — Module `ListItemButton` has no `&:focus-visible`

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/components/Sidebar.tsx` — add focus-visible to shared sx objects

**Out of scope**:
- Other components (they may have their own focus patterns)

## Steps

### Step 1: Add focus-visible to sidebarInactiveSx

In `src/components/Sidebar.tsx`, add to `sidebarInactiveSx`:

```ts
const sidebarInactiveSx = {
  borderLeft: '3px solid transparent',
  backgroundColor: 'transparent',
  '&:hover': { backgroundColor: draculaColors.background },
  '&:focus-visible': { outline: `2px solid ${draculaColors.cyan}`, outlineOffset: -2 },
} as const;
```

### Step 2: Add focus-visible to sidebarActiveSx

```ts
const sidebarActiveSx = {
  borderLeft: `3px solid ${draculaColors.purple}`,
  backgroundColor: draculaColors.background,
  '&:hover': { backgroundColor: draculaColors.background },
  '&:focus-visible': { outline: `2px solid ${draculaColors.cyan}`, outlineOffset: -2 },
} as const;
```

### Step 3: Apply to category headers

The category header `ListItemButton`s at lines 231 and 269 don't use the shared sx objects. Add the same `&:focus-visible` style to them.

### Step 4: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0
**Verify**: In browser, Tab through sidebar items — each should show a cyan outline when focused

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `sidebarActiveSx` and `sidebarInactiveSx` both have `&:focus-visible`
- [ ] Category header `ListItemButton`s have `&:focus-visible`

## STOP conditions

- Focus outline is invisible or visually jarring
- Outline overlaps with the active state border-left

## Maintenance notes

- The `outlineOffset: -2` ensures the outline sits inside the border, not outside
- Cyan color (#8be9fd) is used for focus indicators across the app (matches `ghostBtnSx`)
