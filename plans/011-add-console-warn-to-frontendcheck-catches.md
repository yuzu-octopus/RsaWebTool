# Plan 011: Add console.warn to frontendCheck catch blocks

## Status
- Priority: P2
- Effort: S
- Risk: LOW
- Depends on: none
- Category: bug
- Planned at: 08e26cc, 2026-07-03

## Why this matters

All 31 frontendCheck implementations use `catch { return null; }` with no logging. Invalid inputs or logic errors silently fall through to SageMath with zero diagnostic output. This makes debugging impossible — when a user reports "the attack didn't work in the browser but did in SageMath", there's no trace of what went wrong.

## Current state

- Every frontendCheck has `catch { return null; }` or `catch(e) { return null; }`
- Examples: `batch-gcd.ts:72`, `common-prime-rsa.ts:71`, `implicit-key-exposure.ts:68`, `pollard-rho.ts:143`
- The attack ID is available in the closure via the exported attack object

## Commands

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Typecheck | `bun run typecheck`| exit 0   |

## Steps

### Step 1: Add console.warn to each catch block

In each of the 31 frontendCheck functions, change:
```typescript
catch { return null; }
```
to:
```typescript
catch (e) { console.warn(`[${attackId}] frontendCheck error:`, e); return null; }
```

The attackId is available as the exported `attack.id` property. In the frontendCheck closure, reference it from the attack object.

For files that use `catch (e) { return null; }`, just add the console.warn before the return.

### Step 2: Verify

- `bun run typecheck` passes
- Manual test: enter invalid input for an attack — browser console should show the warning

## Done criteria

- [ ] All 31 frontendCheck catch blocks log the error with attack ID
- [ ] bun run typecheck exits 0
