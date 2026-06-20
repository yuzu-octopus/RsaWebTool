# Plan 012: Add prefill support to PEM Decryptor action buttons

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 0de0604..HEAD -- src/components/PemDecryptor.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: commit `0de0604`, 2026-06-20

## Why this matters

The PEM Decryptor has a "Feed to Attacks" button that switches to the Magic Panel and dispatches a `magic-prefill` event with n/e. But the "Switch to Calculator" button only shows a notification — it doesn't prefill the calculator with the extracted parameters. This is a missed UX opportunity.

## Current state

- `src/components/PemDecryptor.tsx:378-384` — "Switch to Calculator" button:
  ```tsx
  onClick={() => {
    const { n: nVal } = parsed.keyParams!;
    if (!nVal || nVal === '0') return;
    setViewMode('calculator');
    setCalculatorMode('rsa');
    showNotification('Switched to RSA Calculator — paste n/e from copied params', 'success');
  }}
  ```
- `src/components/PemDecryptor.tsx:80-89` — "Feed to Attacks" already dispatches `magic-prefill` event.

## Commands you will need

| Purpose   | Command                    | Expected on success |
|-----------|----------------------------|---------------------|
| Typecheck | `bun run typecheck`        | exit 0, no errors   |
| Lint      | `bun run lint`             | exit 0              |

## Scope

**In scope**:
- `src/components/PemDecryptor.tsx`

**Out of scope**:
- The RSA Calculator component (no changes needed — it already handles input from context).

## Git workflow

- Branch: `advisor/012-pem-prefill"
- Commit message style: `feat: prefill RSA Calculator from PEM Decryptor`

## Steps

### Step 1: Dispatch a calculator-prefill event from the Switch to Calculator button

In `src/components/PemDecryptor.tsx`, modify the "Switch to Calculator" button's onClick handler (lines 378-384) to dispatch a `calculator-prefill` event with the extracted parameters:

```tsx
onClick={() => {
  const { n: nVal, e: eVal } = parsed.keyParams!;
  if (!nVal || nVal === '0') return;
  setViewMode('calculator');
  setCalculatorMode('rsa');
  window.dispatchEvent(new CustomEvent('calculator-prefill', {
    detail: { n: nVal, e: eVal }
  }));
  showNotification('Prefilled RSA Calculator with key parameters', 'success');
}}
```

**Verify**: `bun run typecheck` → exit 0

### Step 2: Handle the calculator-prefill event in the RSA Calculator

The RSA Calculator (`src/components/calculator/RSACalculator.tsx`) or its sub-tabs need to listen for this event. Check if there's an existing pattern for prefill events (the Magic Panel already handles `magic-prefill` at `src/components/MagicPanel.tsx:278-288`).

Add a similar `useEffect` listener in the RSA Calculator's Key Gen or Decrypt tab that sets the n/e values from the event detail.

**Verify**: `bun run typecheck` → exit 0

### Step 3: Lint

**Verify**: `bun run lint` → exit 0

## Test plan

- No new unit tests needed — this is a UI interaction change.
- Manual verification: Parse a PEM key, click "Switch to Calculator", confirm n/e are prefilled in the RSA Calculator.

## Done criteria

- [ ] `bun run typecheck` exits 0
- [ ] `bun run lint` exits 0
- [ ] "Switch to Calculator" button dispatches `calculator-prefill` event
- [ ] RSA Calculator listens for and handles the event
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The code at the locations in "Current state" doesn't match the excerpts.
- A step's verification fails twice after a reasonable fix attempt.
- The RSA Calculator doesn't have a suitable location to add the event listener (check first).

## Maintenance notes

- This follows the same pattern as `magic-prefill` — a CustomEvent dispatched on `window`.
- If other calculators (AES, ECC) need prefill support later, the same pattern applies.
- Reviewer should verify the event listener is properly cleaned up in the useEffect return.
