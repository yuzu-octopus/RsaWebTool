# Plan 010: Establish test coverage baseline for critical paths

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/utils/__tests__/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

The codebase has only 5 test files covering `src/utils/` (bigint, converters, rsaCalc, asn1, pemParser). There are zero unit tests for:
- 47 attack files (the core feature)
- 12 hooks (attack execution, worker pool, SageMath, magic execution)
- 40+ components (UI)
- Config and context modules

This means no regression safety for the most critical code paths. Adding tests for the utility modules that attacks depend on (sageOutput, factordb, progressEstimator) provides the most leverage per test written.

## Current state

- `src/utils/__tests__/` — 5 test files: `asn1.test.ts`, `bigint.test.ts`, `converters.test.ts`, `pemParser.test.ts`, `rsaCalc.test.ts`
- `package.json:17`: `"test:unit": "bun test src/utils/__tests__/"`
- No test configuration beyond Bun's built-in test runner.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |
| Tests     | `bun run test:unit`        | all pass            |

## Scope

**In scope**:
- `src/utils/__tests__/sageOutput.test.ts` (create)
- `src/utils/__tests__/factordb.test.ts` (create)
- `src/utils/__tests__/progressEstimator.test.ts` (create)

**Out of scope**:
- Component tests (would require React Testing Library setup — separate effort)
- Hook tests (would require React Testing Library + mock setup)
- Attack tests (covered by `test:attacks` E2E script)

## Git workflow

- Branch: `advisor/010-test-coverage-baseline`
- Commit message style: `test: add unit tests for sageOutput, factordb, progressEstimator`

## Steps

### Step 1: Create sageOutput.test.ts

Create `src/utils/__tests__/sageOutput.test.ts` with tests for:
- `isActualSuccess(output)` — returns true for "=SUCCESS", false for "=FAILED", false for empty/malformed strings
- Edge cases: partial matches, multiple tokens, whitespace

Model after the existing `bigint.test.ts` structure.

**Verify**: `bun run test:unit` → all pass including new tests

### Step 2: Create factordb.test.ts

Create `src/utils/__tests__/factordb.test.ts` with tests for:
- `extractPQ(output)` — extracts p and q from stdout, returns null for missing values
- `extractPQ` with various formats (whitespace, leading zeros, large numbers)
- Note: `queryFactorDB` and `reportFactor` make network calls — don't test those directly.

**Verify**: `bun run test:unit` → all pass

### Step 3: Create progressEstimator.test.ts

Create `src/utils/__tests__/progressEstimator.test.ts` with tests for:
- `ProgressEstimator.update(pct)` — returns formatted ETA string
- `ProgressEstimator.reset()` — clears state
- Edge cases: 0%, 100%, rapid updates

**Verify**: `bun run test:unit` → all pass

### Step 4: Run full verification

**Verify**: `bun run typecheck` → exit 0, `bun run lint` → exit 0, `bun run test:unit` → all pass

## Test plan

- Each test file follows the existing pattern in `src/utils/__tests__/bigint.test.ts`.
- Use `describe`/`it` blocks with clear test names.
- Test both happy paths and edge cases.
- No mocking needed — these are pure function tests.

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `bun run test:unit` exits 0 with 3 new test files passing
- [ ] `src/utils/__tests__/sageOutput.test.ts` exists with ≥5 test cases
- [ ] `src/utils/__tests__/factordb.test.ts` exists with ≥3 test cases
- [ ] `src/utils/__tests__/progressEstimator.test.ts` exists with ≥3 test cases
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.
- The utility functions have no exported API to test (check exports first).

## Maintenance notes

- These tests cover the utility layer that attacks depend on. If attack logic changes, these tests should still pass.
- Future work: add component tests with React Testing Library, hook tests with renderHook.
- The `test:attacks` E2E script covers attack correctness but not utility edge cases.
