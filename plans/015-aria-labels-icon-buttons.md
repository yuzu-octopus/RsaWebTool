# Plan 015: Add aria-labels to all icon-only buttons

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

Only 5 of ~15+ icon buttons have aria-labels. Screen reader users cannot identify the purpose of icon-only buttons. This violates WCAG 2.1 SC 1.1.1.

## Current state

Buttons WITH aria-labels:
- `Sidebar.tsx:177` — hamburger menu
- `HashFunctionsTab.tsx:151` — copy hash output
- `ResultBox.tsx:79` — copy result
- `PemDecryptor.tsx:344` — copy individual param
- `OutputPanel.tsx:250` — copy output

Buttons WITHOUT aria-labels:
- `OutputPanel.tsx:156` — `<Button startIcon={<ArrowBack fontSize="small" />}>Back</Button>` (has text, but icon should be aria-hidden)
- `MagicPanel.tsx:153-159` — `<IconButton><ContentCopy /></IconButton>` in job result expand
- `InputPanel.tsx:244` — `<Button startIcon={<Casino />}>Generate</Button>` (has text, icon should be aria-hidden)
- `InputPanel.tsx:251` — `<Button startIcon={<Stop />}>Stop</Button>` / `<Button>Run</Button>` (has text, OK)
- `PemDecryptor.tsx:74` — copy all params button
- Various CommandPalette item icons

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/components/OutputPanel.tsx` — ArrowBack button
- `src/components/MagicPanel.tsx` — ContentCopy in job expand
- `src/components/PemDecryptor.tsx` — copy all params button
- All icon-only `IconButton` elements found via grep

**Out of scope**:
- Buttons with visible text (they're already accessible)
- Sidebar navigation items (they haveListItemText)

## Steps

### Step 1: Find all IconButton elements

Run: `grep -rn "IconButton" src/components/ --include="*.tsx"`

For each, check if it has `aria-label`. If not, add one.

### Step 2: Add aria-labels

- `OutputPanel.tsx:156` — The Back button has text "Back" so it's OK. But the icon should have `aria-hidden="true"` since the button text provides the label.
- `MagicPanel.tsx:155` — Add `aria-label="Copy result"` to the IconButton
- `PemDecryptor.tsx:74` — The button has text "Copy All Params" so it's OK. No change needed.

### Step 3: Mark decorative icons as aria-hidden

For buttons that have visible text AND a startIcon, the icon is decorative:
- Add `aria-hidden="true"` to `startIcon` elements that are purely decorative

### Step 4: Verify

**Verify**: `bun run typecheck` → exit 0
**Verify**: `bun run lint` → exit 0
**Verify**: `grep -rn "IconButton" src/components/ --include="*.tsx" | grep -v "aria-label\|aria-hidden"` — no IconButton without accessibility annotation

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] Every `IconButton` has either `aria-label` or the parent button has visible text
- [ ] Decorative icons in text buttons have `aria-hidden="true"`

## STOP conditions

- Adding aria-labels causes TypeScript errors (unlikely — aria-label is a standard HTML attribute)

## Maintenance notes

- New icon buttons must always include aria-label
- Use `aria-hidden="true"` for decorative icons in buttons that already have text labels
