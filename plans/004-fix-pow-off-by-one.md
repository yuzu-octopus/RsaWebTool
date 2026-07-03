# Plan 004: Fix off-by-one in PoW leading-zero-bit check

## Status
- Priority: P2
- Effort: S
- Risk: LOW
- Depends on: none
- Planned at: 83aa232

## Why this matters

The `checkLeadingZeros` function in pow-worker.ts uses `>=` when it should use `>` for the partial-byte comparison. With difficulty=1, byte value 0x80 (binary 10000000) has the required leading zero bit but is rejected by the current check. This silently shrinks the valid nonce space by ~25% for difficulty=1.

## Current state

- `src/workers/pow-worker.ts:37-38`:
```ts
const maxVal = 1 << (8 - remainingBits);
if (hashArray[fullBytes] >= maxVal) return false;
```

With difficulty=1, remainingBits=1, maxVal=128. Byte 0x80 (which has leading zero bit = 0) is rejected because 128 >= 128.

## Scope

**In scope:**
- `src/workers/pow-worker.ts` — fix the comparison operator

## Steps

### Step 1: Change >= to >

```ts
// Before
if (hashArray[fullBytes] >= maxVal) return false;
// After
if (hashArray[fullBytes] > maxVal) return false;
```

### Step 2: Verify
- `bun run typecheck` passes
- Manual test: set difficulty=1 in the PoW UI and confirm it finds nonces faster (wider nonce space)

## Done criteria
- [ ] Comparison uses `>` not `>=`
- [ ] `bun run typecheck` exits 0
