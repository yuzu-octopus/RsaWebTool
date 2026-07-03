# Plan 013: Add missing usageGuide fields to 25 attacks

## Status
- Priority: P2
- Effort: M
- Risk: LOW
- Depends on: none
- Category: docs
- Planned at: 08e26cc, 2026-07-03

## Why this matters

25 of 47 attacks are missing the `usageGuide` field. The InputPanel renders usage guides when present, providing inline guidance. Key attacks like boneh-durfee, quadratic-sieve, pollard-rho, and batch-gcd lack this guidance while more niche attacks have it.

## Current state

- 22 attacks have usageGuide, 25 don't
- Existing guides follow a consistent pattern: description + numbered steps + tip
- The Attack type has `usageGuide?: string` (optional)

## Commands

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Typecheck | `bun run typecheck`| exit 0   |

## Steps

### Step 1: Add usageGuide to all 25 missing attacks

For each attack without usageGuide, add a field following the established pattern:

```typescript
usageGuide: `Brief description of when to use this attack.

How to use:
1. Step one
2. Step two
3. Step three

Tip: Practical advice.`,
```

Priority order (high-priority attacks first):
1. boneh-durfee, quadratic-sieve, partial-key-exposure, common-prime-rsa
2. batch-gcd, multi-prime-gcd, implicit-key-exposure
3. ecm2, euler, pollard-rho, pollard-p1, pollard-strassen
4. squfof, williams-p1, novelty-primes, pisano-period, gimmicky-primes
5. multi-prime, close-prime, factordb-lookup, phi-leak, known-plaintext, common-modulus

### Step 2: Verify

- `bun run typecheck` passes
- Manual test: check 5 attacks in InputPanel — Explanation tab should show usage guide

## Done criteria

- [ ] All 47 attacks have usageGuide
- [ ] bun run typecheck exits 0
