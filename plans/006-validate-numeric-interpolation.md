# Plan 006: Validate numeric inputs before Python interpolation

## Status
- Priority: P1
- Effort: M
- Risk: MED
- Depends on: none
- Category: security
- Planned at: 08e26cc, 2026-07-03

## Why this matters

~90 sites across 47 attack files interpolate user input directly into Python code via `${vals.X}`. Numeric fields (n, e, c, p, q) are never validated — a user could inject Python code like `1"); import os; os.system("id"); x = Integer(` which escapes the Integer() wrapper and executes on the remote SageMathCell kernel. String fields already use sanitizePython() but numeric fields are unprotected.

## Current state

- `src/attacks/boneh-durfee.ts:18`: `n = Integer(${vals.n})` — raw interpolation
- `src/attacks/homomorphic-forgery.ts:26-28`: `target_m = Integer(${vals.target_m})` — raw interpolation
- `src/attacks/simple-lattice.ts:18-19`: `n = Integer(${vals.n})` — raw interpolation
- `src/attacks/related-message.ts:24-35`: six raw interpolation sites
- `src/attacks/guard.ts:133-138`: sanitizePython() exists but only escapes `"`, `\`, `\n`, `\r`
- ~90 total `${vals.*}` interpolation sites, ~70 without sanitizePython()

## Commands

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Typecheck | `bun run typecheck`| exit 0   |
| Lint      | `bun run lint`     | exit 0   |
| Tests     | `bun run test:unit`| all pass |

## Steps

### Step 1: Add numeric validation to guard.ts

Add a validateNumeric function to src/attacks/guard.ts:

```typescript
export function validateNumeric(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (!/^-?\d+$/.test(trimmed)) {
    throw new Error(`${fieldName} must be a valid integer, got: "${trimmed.slice(0, 50)}"`);
  }
  return trimmed;
}
```

### Step 2: Apply validateNumeric to all numeric interpolation sites

In each attack file that uses `${vals.X}` where X is a numeric field (n, e, c, p, q, d, dp, dq, phi, etc.), wrap the value:

Before: `n = Integer(${vals.n})`
After: `n = Integer(${validateNumeric(vals.n, 'n')})`

Import changes from:
```typescript
import { wrapSageTemplate, sanitizePython } from './guard';
```
to:
```typescript
import { wrapSageTemplate, sanitizePython, validateNumeric } from './guard';
```

Apply to all 47 attack files with numeric interpolation. Grep for `${vals.` and wrap every numeric field.

### Step 3: Verify

- `bun run typecheck` passes
- `bun run lint` passes
- `bun run test:unit` passes
- Manually test: entering `1"); import os; os.system("id"); x = Integer(` as a value shows a validation error

## Done criteria

- [ ] bun run typecheck exits 0
- [ ] bun run lint exits 0
- [ ] bun run test:unit passes
- [ ] validateNumeric exists in guard.ts
- [ ] All numeric ${vals.*} interpolation sites use validateNumeric()
- [ ] No numeric field is interpolated raw into Python

## STOP conditions

- validateNumeric rejects valid input that the attack needs
- A frontendCheck breaks after the change
- More than 50 files need changes
