# Plan 024: Extract custom logo SVG into shared component

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: Plan 013 (LogoIcon component)
- **Category**: direction (design system)
- **Planned at**: commit `3009efc`, 2026-06-22

## Why this matters

The finetuning project uses a single custom SVG for both favicon and sidebar. This plan ensures the LogoIcon component created in Plan 013 is properly shared and that future logo changes only need to update one file.

## Current state

After Plan 013:
- `src/components/_shared/LogoIcon.tsx` — SVG component
- `index.html` — favicon is a copy of the same SVG
- `Sidebar.tsx` — uses `<LogoIcon>`

The SVG is defined in TWO places (LogoIcon.tsx and index.html). If the logo changes, both must be updated.

## Steps

### Step 1: Verify LogoIcon is used correctly

After Plan 013 executes, verify:
1. `LogoIcon.tsx` exists and exports the component
2. `Sidebar.tsx` imports and uses it
3. `index.html` favicon matches the LogoIcon SVG design

### Step 2: Document the single-source-of-truth pattern

Add a comment in `LogoIcon.tsx`:

```tsx
/**
 * Shared logo SVG component. Used in:
 * - Sidebar header (this component)
 * - index.html favicon (inline copy — update both if design changes)
 *
 * Design: Dracula purple unlocked padlock on transparent background.
 * For favicon, wrap in a 72x72 rounded-rect with #282a36 background.
 */
```

### Step 3: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0

## Done criteria

- [ ] LogoIcon.tsx has documentation comment about dual usage
- [ ] Favicon and sidebar use the same SVG design
