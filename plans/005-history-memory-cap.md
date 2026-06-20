# Plan 005: Reduce history in-memory cap and truncate sensitive fields

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/context/AppContext.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/context/AppContext.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

History stores up to 500 full attack result strings in JavaScript memory, including factorization results with p, q, d, and decrypted messages. These sensitive crypto values persist for the session lifetime and are accessible via browser devtools memory inspection. The localStorage persistence already truncates to 200 chars, but the in-memory store holds full text.

## Current state

- History is managed in `src/context/AppContext.tsx` (not directly read, but used via `useAppContext`).
- `src/hooks/useAttackExecution.ts:170`: `addToHistory(attack.id, attack.name, preResult, isActualSuccess(preResult))` — full result string passed.
- The AGENTS.md documents: history cap 50, localStorage truncates to 200 chars.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/context/AppContext.tsx`

**Out of scope**:
- `src/hooks/useAttackExecution.ts` — passes full result; truncation should happen at storage time.

## Git workflow

- Branch: `advisor/005-history-memory-cap`
- Commit message style: `fix: reduce history cap to 50 and truncate stored results`

## Steps

### Step 1: Read AppContext.tsx to find the addToHistory logic

Read `src/context/AppContext.tsx` to find the `addToHistory` implementation and the history state management. Look for the array `.slice(0, 500)` or similar cap.

### Step 2: Reduce the in-memory cap from 500 to 50

Change the history array slice from `.slice(0, 500)` to `.slice(0, 50)`.

### Step 3: Truncate the result string before storing

Before adding to history, truncate the result string to 200 characters (matching the localStorage behavior):

```ts
const truncatedResult = result.length > 200 ? result.slice(0, 200) + '…' : result;
```

Use `truncatedResult` instead of `result` when creating the `HistoryEntry`.

**Verify**: `bun run typecheck` → exit 0

### Step 4: Lint

**Verify**: `bun run lint` → exit 0

## Test plan

- No new unit tests needed — this is a cap and truncation change.
- Manual verification: Run several attacks, check that history shows at most 50 entries, and that long results are truncated with "…".

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] History in-memory cap is 50 (not 500)
- [ ] Stored history results are truncated to 200 chars
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- The 50-entry cap is generous for a CTF session. If users need more, it can be increased.
- Truncation means history entries show partial results — the full result is still in the OutputPanel during the session.
