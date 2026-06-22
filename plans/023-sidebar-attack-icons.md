# Plan 023: Add category icons to attack list items in sidebar

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

All 47 attack entries in the sidebar are plain text without icons, while calculator and module items all have icons. This creates a visual density imbalance that makes the attack list harder to scan.

## Current state

- `Sidebar.tsx:244-261` — Each attack `ListItemButton` renders only `ListItemText`
- Calculator items have icons at `Sidebar.tsx:295-297`
- Module items have icons at `Sidebar.tsx:325-326`
- `CommandPalette.tsx` has `CATEGORY_COLORS` mapping for category-based colors

## Steps

### Step 1: Define category icons and colors

Create a mapping in `Sidebar.tsx`:

```ts
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Factorization': <Security sx={{ fontSize: ICON_SIZES.sm, color: draculaColors.cyan }} />,
  'Partial Key / Lattice': <Hub sx={{ fontSize: ICON_SIZES.sm, color: draculaColors.purple }} />,
  'Message / Protocol': <Lock sx={{ fontSize: ICON_SIZES.sm, color: draculaColors.green }} />,
  'Oracle': <VpnKey sx={{ fontSize: ICON_SIZES.sm, color: draculaColors.orange }} />,
  'Advanced': <Tag sx={{ fontSize: ICON_SIZES.sm, color: draculaColors.pink }} />,
};
```

### Step 2: Add icons to attack list items

In the attack `ListItemButton` rendering loop, prepend the category icon:

```tsx
<ListItemButton key={attack.id} ...>
  {CATEGORY_ICONS[attack.category]}
  <ListItemText primary={attack.name} ... />
</ListItemButton>
```

### Step 3: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0
**Verify**: In sidebar, each attack item has a small colored icon before its name

## Done criteria

- [ ] Each attack category has a distinct icon in the sidebar
- [ ] Icons use consistent sizing from ICON_SIZES
- [ ] Visual scanability of the attack list is improved
