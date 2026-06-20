# Plan 002: Scope env.reset() to only clear rsa:env: localStorage keys

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/config/env.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

`env.reset()` calls `localStorage.clear()` which destroys ALL localStorage keys on the domain — including notepad content (`notepad:v1`), history (`rsa-history:v1`), panel resize preferences (`outputPanelWidth`, `notepadHeight`), and any other app state. The user expects `env.reset()` to restore env config defaults, not wipe their entire session.

## Current state

- `src/config/env.ts:80-83`:
  ```ts
  reset(): void {
    localStorage.clear();
    window.location.reload();
  }
  ```
- The `PREFIX` constant at line 27 is `'rsa:env:'` — all env keys are namespaced under this prefix.
- Other localStorage keys used by the app: `notepad:v1`, `rsa-history:v1`, `outputPanelWidth`, `notepadHeight`.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/config/env.ts`

**Out of scope**:
- No other files need changes.

## Git workflow

- Branch: `advisor/002-env-reset-scope`
- Commit message style: `fix: scope env.reset() to only clear rsa:env: keys`

## Steps

### Step 1: Replace localStorage.clear() with prefix-scoped removal

In `src/config/env.ts`, replace the `reset()` method body (lines 80-83):

```ts
reset(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(PREFIX)) keysToRemove.push(key);
  }
  for (const key of keysToRemove) localStorage.removeItem(key);
  window.location.reload();
}
```

**Verify**: `bun run typecheck` → exit 0

### Step 2: Lint

**Verify**: `bun run lint` → exit 0

## Test plan

- No new unit tests needed — this is a straightforward scope fix.
- Manual verification: In browser console, set `window.env.reset()` and confirm only `rsa:env:*` keys are removed while `notepad:v1`, `rsa-history:v1`, etc. remain.

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `env.reset()` no longer calls `localStorage.clear()`
- [ ] `env.reset()` only removes keys prefixed with `rsa:env:`
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.

## Maintenance notes

- If new non-env localStorage keys are added in the future, they will automatically be preserved by this fix.
- If the PREFIX constant changes, `reset()` will automatically follow since it uses the same `PREFIX` reference.
