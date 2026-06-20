# Plan 009: Make extractFrontendCheck brace counter string/regex-aware

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/attacks/rawSources.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

The `extractFrontendCheck` function in `rawSources.ts` uses a brace-counting loop that tracks `${...}` template expressions but not regular string literals (`"{"`, `'{'`) or regex (`/pattern/{/`). If any attack's `frontendCheck` body contains braces inside a string or regex, the counter closes too early or too late, causing the Source tab to display a truncated or garbled function. No current attack triggers this, but it's a latent bug.

## Current state

- `src/attacks/rawSources.ts:104-135` — brace-counting loop that tracks `${...}` but not string literals or regex.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/attacks/rawSources.ts`

**Out of scope**:
- No other files need changes.

## Git workflow

- Branch: `advisor/009-frontendcheck-brace-counter`
- Commit message style: `fix: make extractFrontendCheck brace counter string/regex-aware`

## Steps

### Step 1: Read rawSources.ts to understand the current implementation

Read `src/attacks/rawSources.ts` to find the `extractFrontendCheck` function and its brace-counting logic. Identify the exact lines that need modification.

### Step 2: Add string/regex awareness to the brace counter

Modify the brace-counting loop to skip over:
- Double-quoted strings (`"..."`)
- Single-quoted strings (`'...'`)
- Template literals (backtick strings, tracking `${...}` inside them)
- Regular expressions (`/.../`)

The minimal approach: track whether we're inside a string/regex and skip brace counting when inside. This requires a small state machine:

```ts
let inString: false | '"' | "'" | '`' = false;
let inRegex = false;
let escape = false;

for (let i = funcBody.indexOf('{'); i < funcBody.length; i++) {
  const ch = funcBody[i];
  
  if (escape) { escape = false; continue; }
  if (ch === '\\') { escape = true; continue; }
  
  if (inString) {
    if (ch === inString) inString = false;
    continue;
  }
  if (inRegex) {
    if (ch === '/') inRegex = false;
    continue;
  }
  
  if (ch === '"' || ch === "'" || ch === '`') { inString = ch; continue; }
  if (ch === '/' && funcBody[i+1] !== '/' && funcBody[i+1] !== '*') { inRegex = true; continue; }
  
  if (ch === '{') { depth++; }
  else if (ch === '}') { depth--; }
  
  // ... rest of existing logic
}
```

**Verify**: `bun run typecheck` → exit 0

### Step 3: Lint

**Verify**: `bun run lint` → exit 0

## Test plan

- No new unit tests needed — this is a parser robustness fix.
- Manual verification: Open the Source tab for several attacks and confirm the extracted `frontendCheck` code looks correct (not truncated or garbled).

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `extractFrontendCheck` handles braces inside string literals and regex
- [ ] Source tab still displays correct frontendCheck code for existing attacks
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.
- The Source tab breaks for any existing attack.

## Maintenance notes

- This is a conservative fix. A full tokenizer would be more robust but overkill for this use case.
- If攻击 frontendCheck functions start using more complex string patterns, this parser may need enhancement.
- Reviewer should spot-check 5-10 attack Source tabs to confirm correct extraction.
