# Plan 008: Track non-success frontendCheck results in Magic execution

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/hooks/useMagicExecution.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

In `useMagicExecution`, when an early success triggers `cancelCurrentRun()`, any frontendCheck that returned a non-success result (e.g., `=FAILED`) but hadn't set `preCheckResults[idx]` yet leaves its slot as `null`. These attacks are then added to the `remaining` list for SageCell retry, wasting SageCell slots on attacks that already failed in the frontend.

## Current state

- `src/hooks/useMagicExecution.ts:159-206` — `runFrontendCheckPhase` fires all frontendChecks in parallel. When one succeeds (line 174-178), it calls `cancelCurrentRun()` which resolves ALL pending tasks with null. Non-success results that completed before the cancel leave `preCheckResults[idx]` as `null`.
- `src/hooks/useMagicExecution.ts:364-369` — the `remaining` list is built by checking `if (!preCheckResults[i])`, which treats both `null` (not checked) and `undefined` (not set) the same.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/hooks/useMagicExecution.ts`

**Out of scope**:
- No other files need changes.

## Git workflow

- Branch: `advisor/008-magic-non-success-results`
- Commit message style: `fix: track non-success frontendCheck results in Magic execution`

## Steps

### Step 1: Record non-success frontendCheck results

In `src/hooks/useMagicExecution.ts`, inside the `runFrontendCheckPhase` function, after the `isSuccess` check at line 166-179, add an `else` branch to record non-success results:

```ts
if (result !== null) {
  const isSuccess = isActualSuccess(result);
  preCheckResults[idx] = { result, isSuccess };
  // ... existing success handling ...
} else {
  // frontendCheck returned null (not applicable) — mark aborted
  // No change needed here — null means not applicable, not failed
}
```

Wait — looking more carefully, the issue is that when `cancelCurrentRun()` is called on early success (line 176), any in-flight tasks that complete between the cancel and their resolution get `null` from the worker pool (since `cancelCurrentRun` resolves all pending with null). These `null` results hit the `else` branch at line 180-187 which marks the job as `aborted`.

The real fix is: in the `remaining` list construction (line 364-369), also exclude jobs that were marked as `error` or `aborted` (which means the frontendCheck ran but didn't succeed):

```ts
// Before:
for (let i = 0; i < attacksToRun.length; i++) {
  if (!preCheckResults[i]) {
    remaining.push({ attack: attacksToRun[i], originalIndex: i });
  }
}

// After:
for (let i = 0; i < attacksToRun.length; i++) {
  if (!preCheckResults[i] && jobs[i].status === 'running') {
    remaining.push({ attack: attacksToRun[i], originalIndex: i });
  }
}
```

This ensures only attacks that were still `running` (i.e., the worker was cancelled before they could complete) are retried in the SageCell phase.

**Verify**: `bun run typecheck` → exit 0

### Step 2: Lint

**Verify**: `bun run lint` → exit 0

## Test plan

- No new unit tests needed — this is a subtle timing fix.
- Manual verification: Run Magic Panel with a testcase where multiple attacks have frontendChecks. If one succeeds early, confirm that failed frontendChecks are NOT retried via SageCell.

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] The `remaining` list in `handleCrack` only includes attacks with `jobs[i].status === 'running'`
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- This fix depends on the job status being correctly set during the frontendCheck phase. If the status update logic changes, this filtering may need updating.
- The `jobs` state is updated via `setJobs` inside the `runFrontendCheckPhase` callbacks, so it's available by the time the `remaining` list is built (after the `await` resolves).
