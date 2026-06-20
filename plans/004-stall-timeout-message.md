# Plan 004: Use configurable stallTimeout in error messages

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/hooks/useSageMath.ts`
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

The stall detection error message at `src/hooks/useSageMath.ts:228` hardcodes `"no output for 30s"` but the actual timeout is `env.stallTimeout * 1000`, which the user can customize via the console (`env.stallTimeout = 60`). If the user sets a different timeout, the error message is misleading.

## Current state

- `src/hooks/useSageMath.ts:228`:
  ```ts
  error: `SageCell kernel stalled — no output for 30s.\n\nOutput before stall:\n${text.trim()}`,
  ```
- The stall timeout is computed as `env.stallTimeout * 1000` at line 223.
- `env.stallTimeout` defaults to 30 (seconds) per `src/config/env.ts:6`.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/hooks/useSageMath.ts`

**Out of scope**:
- `src/config/env.ts` — no changes needed.

## Git workflow

- Branch: `advisor/004-stall-timeout-message`
- Commit message style: `fix: use configurable stallTimeout in error messages`

## Steps

### Step 1: Replace hardcoded "30s" with env.stallTimeout

In `src/hooks/useSageMath.ts`, replace line 228:

```ts
// Before:
error: `SageCell kernel stalled — no output for 30s.\n\nOutput before stall:\n${text.trim()}`,

// After:
error: `SageCell kernel stalled — no output for ${env.stallTimeout}s.\n\nOutput before stall:\n${text.trim()}`,
```

Also fix line 234 (the empty stdout variant):

```ts
// Before:
error: 'SageCell produced no output for 30s. The kernel may have crashed or the computation is too slow for remote execution.',

// After:
error: `SageCell produced no output for ${env.stallTimeout}s. The kernel may have crashed or the computation is too slow for remote execution.`,
```

**Verify**: `bun run typecheck` → exit 0

### Step 2: Lint

**Verify**: `bun run lint` → exit 0

## Test plan

- No new unit tests needed — this is a string interpolation fix.
- Manual verification: In browser console, set `env.stallTimeout = 60`, trigger a stall, and confirm the error message says "60s" not "30s".

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] No hardcoded "30s" in stall error messages in `src/hooks/useSageMath.ts`
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- If the stall timeout mechanism changes (e.g., removed or renamed), these error messages need updating too.
