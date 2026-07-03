# Plan 002: Remove dead code — useNotepad, inputSx duplication, .opencode

## Status
- Priority: P1
- Effort: S
- Risk: LOW
- Depends on: none
- Planned at: 83aa232

## Why this matters

Three independent dead code items waste space and confuse maintainers:
1. `useNotepad.ts` — 68-line hook with zero importers (notepad was removed from OutputPanel)
2. `inputSx.ts` — duplicated identically in `shared.ts`; 19 files import from the old path
3. `.opencode/node_modules/` — 57MB vendored node_modules on disk (not in git)

## Scope

**In scope:**
- `src/hooks/useNotepad.ts` — delete
- `src/styles/inputSx.ts` — delete, update 19 importers to use `../styles/shared`
- `src/attacks/.opencode/` — delete directory

**Out of scope:**
- Any functional changes to the components

## Steps

### Step 1: Delete useNotepad.ts
```bash
rm src/hooks/useNotepad.ts
```
Verify no imports remain: `grep -r "useNotepad" src/`

### Step 2: Update inputSx importers
19 files import from `../../styles/inputSx` or `../styles/inputSx`. Update each to import from the corresponding `shared` path:
- Files in `src/components/calculator/`: change `'../../styles/inputSx'` to `'../../styles/shared'`
- Files in `src/components/`: change `'../styles/inputSx'` to `'../styles/shared'`

Then delete `src/styles/inputSx.ts`.

### Step 3: Delete .opencode directory
```bash
rm -rf src/attacks/.opencode/
```

### Step 4: Verify
- `bun run typecheck` passes
- `bun run build` succeeds
- `grep -r "useNotepad\|inputSx" src/` only matches the shared.ts definition

## Done criteria
- [ ] `useNotepad.ts` deleted
- [ ] `inputSx.ts` deleted
- [ ] All 19 importers updated
- [ ] `.opencode/` deleted
- [ ] `bun run typecheck` exits 0
