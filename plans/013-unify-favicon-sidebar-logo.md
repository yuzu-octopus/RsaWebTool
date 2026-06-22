# Plan 013: Unify favicon and sidebar logo to single custom SVG

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 3009efc..HEAD -- index.html src/components/Sidebar.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: visual
- **Planned at**: commit `3009efc`, 2026-06-22

## Why this matters

The browser tab shows a locked padlock favicon while the sidebar displays an unlocked padlock (MUI LockOpen icon). Two different padlock styles for the same brand identity is visually inconsistent. Both should use the same custom SVG.

## Current state

- **Favicon** (`index.html:13`): Inline SVG data URI — locked padlock with closed shackle, keyhole, purple (#bd93f9) body on #282a36 background, viewBox "0 0 100 100"
- **Sidebar** (`src/components/Sidebar.tsx:216`): MUI `LockOpen` icon at `fontSize: '2rem'` inside a 72px circle with `backgroundColor: draculaColors.background`

The finetuning reference project (`/Users/yuzu/Documents/Projects/finetuning/docs/index.html`) uses a custom SVG for both favicon AND sidebar — one source of truth.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `index.html` — replace favicon with new SVG
- `src/components/Sidebar.tsx` — replace MUI LockOpen icon with inline SVG

**Out of scope**:
- `src/components/_shared/LogoIcon.tsx` — created as part of this plan, but no other components should reference it yet

## Steps

### Step 1: Create a shared LogoIcon component

Create `src/components/_shared/LogoIcon.tsx` with a custom SVG of the unlocked padlock (matching the finetuning pattern of inline SVGs). The SVG should:
- Use viewBox "0 0 72 72"
- Have a purple (#bd93f9) padlock body with rounded rect
- Show an open/tilted shackle (unlocked state)
- Include a keyhole (circle + triangle)
- Accept a `size` prop (default "100%") for flexibility
- Accept a `bg` prop (default: transparent) for the circular container background

```tsx
interface LogoIconProps {
  size?: number | string;
  className?: string;
}

export function LogoIcon({ size = '100%', className }: LogoIconProps) {
  return (
    <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" width={size} height={size} className={className}>
      {/* Padlock body */}
      <rect x="18" y="32" width="36" height="28" rx="4" fill="#bd93f9"/>
      {/* Shackle (open — tilted) */}
      <path d="M24 32V24a12 12 0 0 1 12-12h0a12 12 0 0 1 12 12v2" fill="none" stroke="#bd93f9" strokeWidth="4" strokeLinecap="round"/>
      {/* Keyhole circle */}
      <circle cx="36" cy="46" r="3.5" fill="#282a36"/>
      {/* Keyhole triangle */}
      <path d="M34.5 46l1.5 5 1.5-5z" fill="#282a36"/>
    </svg>
  );
}
```

### Step 2: Update Sidebar.tsx to use LogoIcon

In `src/components/Sidebar.tsx`:
1. Add import: `import { LogoIcon } from './_shared/LogoIcon';`
2. Remove the `LockOpen` import from `@mui/icons-material`
3. Replace the `<LockOpen sx={{ fontSize: '2rem', color: draculaColors.purple }} />` with `<LogoIcon size={32} />`

### Step 3: Update favicon in index.html

Replace the inline SVG data URI in `index.html` with the same SVG design. The favicon should be:
- A 72x72 canvas with rounded corners (#282a36 background, rx="12")
- The same purple unlocked padlock centered inside
- ViewBox "0 0 72 72"

Create a new inline SVG data URI matching the LogoIcon component's SVG content but inside a rounded-rect background container.

### Step 4: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0
**Verify**: Visually check in browser — favicon tab icon and sidebar logo should be the same padlock design

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `src/components/_shared/LogoIcon.tsx` exists and exports the SVG component
- [ ] `index.html` favicon uses the same SVG as LogoIcon
- [ ] `Sidebar.tsx` uses `<LogoIcon>` instead of `<LockOpen>`
- [ ] No other files reference `LockOpen` from `@mui/icons-material` (check with grep)

## STOP conditions

- The SVG rendering looks wrong in browser (shackle position, proportions, etc.)
- Any other component besides Sidebar imports `LockOpen`
- `bun run typecheck` fails due to the new component

## Maintenance notes

- If the logo design changes, only `LogoIcon.tsx` and `index.html` need updating
- The favicon SVG in index.html is a copy of LogoIcon's SVG — future changes must update both
