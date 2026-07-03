# Plan 005: Replace hardcoded Dracula hex values in ProofOfWorkTab

## Status
- Priority: P3
- Effort: S
- Risk: LOW
- Depends on: none
- Planned at: 83aa232

## Why this matters

ProofOfWorkTab has hardcoded hex color values (#282a36, #f8f8f2, #44475a) instead of using the `draculaColors` constants. The rest of the file already uses the constants — these are oversights that will break if the palette changes.

## Current state

- `src/components/calculator/hash/ProofOfWorkTab.tsx` — inline hex strings in sx props

## Scope

**In scope:**
- `src/components/calculator/hash/ProofOfWorkTab.tsx` — replace hardcoded hex with draculaColors

## Steps

### Step 1: Replace hardcoded values
- `#282a36` → `draculaColors.background`
- `#f8f8f2` → `draculaColors.foreground`
- `#44475a` → `draculaColors.currentLine`

### Step 2: Verify
- `bun run typecheck` passes
- `bun run lint` passes
- Visual check: PoW tab colors look identical

## Done criteria
- [ ] No hardcoded Dracula hex values in ProofOfWorkTab
- [ ] `bun run typecheck` exits 0
