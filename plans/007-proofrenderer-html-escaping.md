# Plan 007: Escape HTML entities in ProofRenderer inline text

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/components/ProofRenderer.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

`renderInlineText` in ProofRenderer converts LaTeX `\texttt{...}` etc. to `<code>...</code>` via regex but does not escape `<`, `>`, `&` in the captured content before wrapping in HTML tags. The output is fed to `dangerouslySetInnerHTML`. Currently all proof strings are hardcoded with attack definitions, so this is defense-in-depth. But any future feature allowing custom proofs would introduce XSS.

## Current state

- `src/components/ProofRenderer.tsx:135-148` — `renderInlineText` applies regex replacements to convert LaTeX to HTML but doesn't escape the content first.
- `src/components/ProofRenderer.tsx:99,113,122` — output fed to `dangerouslySetInnerHTML`.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/components/ProofRenderer.tsx`

**Out of scope**:
- No other files need changes.

## Git workflow

- Branch: `advisor/007-proofrenderer-html-escaping`
- Commit message style: `fix(security): escape HTML entities in ProofRenderer inline text`

## Steps

### Step 1: Add HTML escape helper and apply before regex replacements

In `src/components/ProofRenderer.tsx`, add a helper function before `renderInlineText`:

```ts
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
```

Then modify `renderInlineText` to escape the input text before applying regex replacements:

```ts
function renderInlineText(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\\texttt\{([^}]+)\}/g, '<code>$1</code>')
    // ... other regex replacements
}
```

**Verify**: `bun run typecheck` → exit 0

### Step 2: Lint

**Verify**: `bun run lint` → exit 0

## Test plan

- No new unit tests needed — this is a defensive escaping change.
- Manual verification: Open any attack's Explanation tab and confirm KaTeX math renders correctly (the escaping should not affect LaTeX commands since they use `\` not `<`).

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] `renderInlineText` escapes HTML entities before applying regex
- [ ] Attack proofs still render correctly (KaTeX math is unaffected)
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.
- Attack proofs break (LaTeX commands are incorrectly escaped).

## Maintenance notes

- If KaTeX rendering is later used inline instead of the custom regex approach, this escaping may become redundant but is still good defense-in-depth.
- Reviewer should spot-check a few attack proofs to confirm they render correctly.
