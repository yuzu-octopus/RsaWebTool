# Plan 007: Fix sanitizePython to escape triple-quotes

## Status
- Priority: P1
- Effort: S
- Risk: LOW
- Depends on: none
- Category: security
- Planned at: 08e26cc, 2026-07-03

## Why this matters

sanitizePython() in guard.ts escapes `"`, `\`, `\n`, `\r` but does not escape triple-quotes `"""`. Ten attack files wrap user input in triple-quoted Python strings (bleichenbacher.ts:31, lsb-oracle.ts:28, manger.ts:31, biased-lsb.ts:42, hastad-linear-pad.ts:24, hastad-broadcast.ts:31, known-plaintext.ts:31, rsa-crt-fault.ts:31, homomorphic-forgery.ts:34, bleichenbacher-sig.ts:26). An input containing `"""` breaks out of the triple-quoted string and enables code injection even when sanitizePython is used.

## Current state

- `src/attacks/guard.ts:133-138`: sanitizePython() escapes `\`, `"`, `\n`, `\r`
- Missing: `"""` → `\"\"\"` escape

## Commands

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Typecheck | `bun run typecheck`| exit 0   |
| Lint      | `bun run lint`     | exit 0   |

## Steps

### Step 1: Add triple-quote escape to sanitizePython

In src/attacks/guard.ts, update the sanitizePython function:

```typescript
export function sanitizePython(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/"""/g, '\\"\\"\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
```

### Step 2: Verify

- `bun run typecheck` passes
- `bun run lint` passes
- Manually test: entering `"""` in a field wrapped in triple-quotes no longer breaks the Python string

## Done criteria

- [ ] sanitizePython escapes triple-quotes
- [ ] bun run typecheck exits 0
- [ ] bun run lint exits 0
