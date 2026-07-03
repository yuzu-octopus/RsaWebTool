# Plan 009: Fix FactorDB non-standard RESULT token

## Status
- Priority: P1
- Effort: S
- Risk: LOW
- Depends on: none
- Category: bug
- Planned at: 08e26cc, 2026-07-03

## Why this matters

factordb-lookup.ts emits `FACTORDB_LOOKUP=RESULT` for partial factorization statuses (CF, C, CP, U). Every other attack uses only `=SUCCESS` or `=FAILED`. Downstream logic (e.g., isActualSuccess in sageOutput.ts) checks for these two tokens, so partial FactorDB results are misclassified as neither success nor failure.

## Current state

- `src/attacks/factordb-lookup.ts:64`: pushes `FACTORDB_LOOKUP=RESULT` for non-FF statuses
- `src/utils/sageOutput.ts`: isActualSuccess() only recognizes SUCCESS and FAILED tokens

## Commands

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Typecheck | `bun run typecheck`| exit 0   |

## Steps

### Step 1: Change RESULT to FAILED for partial results

In `src/attacks/factordb-lookup.ts`, change the token for non-FF statuses from `RESULT` to `FAILED`. Alternatively, update isActualSuccess to also recognize `RESULT` as a valid token — but FAILED is more correct since partial factorization isn't a success.

The cleaner fix: change the token to `FAILED` so all attacks use a consistent two-state convention.

### Step 2: Verify

- `bun run typecheck` passes
- Manual test: query a number with partial FactorDB status (CF) — result should show FAILED, not a confusing intermediate state

## Done criteria

- [ ] No FACTORDB_LOOKUP=RESULT in codebase (only SUCCESS/FAILED)
- [ ] bun run typecheck exits 0
