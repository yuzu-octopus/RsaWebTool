# Plan 006: Sanitize user input before Python interpolation in SageMath templates

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/attacks/guard.ts src/attacks/*.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

SageMath template strings interpolate user input directly into Python code. For example, `hastad-broadcast.ts:31` does `lines_str = """${vals.ciphertexts}"""` — a user (or auto-filled input) could inject arbitrary Python that runs on the SageMathCell kernel. While the tool is browser-only and the user is the attacker, defense-in-depth matters, especially if the tool is ever embedded in a page with auto-filled inputs or a shared URL scheme is added.

## Current state

- `src/attacks/guard.ts:59`: `n = Integer(${n})` — user n value interpolated into Python.
- `src/attacks/hastad-broadcast.ts:31`: `lines_str = """${vals.ciphertexts}"""` — user ciphertexts interpolated.
- `src/attacks/known-plaintext.ts:31`: `known_prefix = "${vals.known_prefix || ''}"` — user prefix interpolated.
- `src/attacks/bleichenbacher.ts:22-33`: multiple `vals.*` values interpolated into Python strings.
- There are ~42 attack files that use `wrapSageTemplate` and interpolate user values.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/attacks/guard.ts` — add a `sanitizePython` helper function
- Individual attack files that interpolate user values directly into Python strings (select the highest-risk ones)

**Out of scope**:
- Attacks that use `wrapSageTemplate` with only numeric `Integer()` interpolation (low risk — BigInt values can't contain Python injection).
- The `sageGuardBlock` function (uses only numeric values).

## Git workflow

- Branch: `advisor/006-sagemath-template-injection`
- Commit message style: `fix(security): sanitize user input before Python interpolation in SageMath templates`

## Steps

### Step 1: Add sanitizePython helper to guard.ts

In `src/attacks/guard.ts`, add a new exported function:

```ts
/**
 * Sanitize a user-supplied string for safe interpolation into a Python
 * string literal. Escapes backslashes, quotes, and newlines.
 */
export function sanitizePython(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
```

Place it after the `sageGuardBlock` function (around line 127).

**Verify**: `bun run typecheck` → exit 0

### Step 2: Apply sanitizePython to highest-risk attack templates

Identify attack files that interpolate user values into Python string literals (not just `Integer()` wrappers). The highest-risk files are:

- `src/attacks/hastad-broadcast.ts` — interpolates `vals.ciphertexts` into a triple-quoted string
- `src/attacks/known-plaintext.ts` — interpolates `vals.known_prefix` into a double-quoted string
- `src/attacks/bleichenbacher.ts` — interpolates multiple user values
- `src/attacks/bleichenbacher-sig.ts` — similar pattern

For each, import `sanitizePython` from `guard.ts` and wrap the user value:

```ts
// Before:
lines_str = """${vals.ciphertexts}"""

// After:
lines_str = """${sanitizePython(vals.ciphertexts)}"""
```

**Verify**: `bun run typecheck` → exit 0

### Step 3: Lint

**Verify**: `bun run lint` → exit 0

## Test plan

- No new unit tests needed — the sanitization function is simple string escaping.
- Manual verification: In the Magic Panel or Input Panel, enter a value containing `"` and `\n` characters and confirm it doesn't break the SageMath execution.

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `sanitizePython` exists in `src/attacks/guard.ts`
- [ ] Highest-risk attack templates use `sanitizePython` for string interpolation
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.
- The sanitization breaks a valid attack template (test with Generate Testcase + Run).

## Maintenance notes

- New attack files that interpolate user values into Python strings should use `sanitizePython`.
- Numeric interpolation via `Integer(${vals.n})` is safe — BigInt values can't contain Python injection characters.
- This is defense-in-depth; the primary risk is if the tool is ever embedded in a context with auto-filled inputs.
