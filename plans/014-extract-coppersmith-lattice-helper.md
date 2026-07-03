# Plan 014: Extract Coppersmith lattice helper from duplicated attack code

## Status
- Priority: P2
- Effort: M
- Risk: MED
- Depends on: none
- Category: tech-debt
- Planned at: 08e26cc, 2026-07-03

## Why this matters

Three attacks (simple-lattice, partial-key-exposure, partial-pq-bits) copy-paste identical Coppersmith lattice construction: m=5, t=5, LCL lattice, LLL reduction, row scanning for two-term polynomials with delta=-2..2. ~200 lines of duplicated Python template code and ~150 lines of duplicated frontendCheck logic. A bug fix or optimization in one must be manually replicated to the other two.

## Current state

- `src/attacks/simple-lattice.ts:45-79`: Coppersmith lattice construction
- `src/attacks/partial-key-exposure.ts:44-89`: Same lattice construction
- `src/attacks/partial-pq-bits.ts:31-62` (MSB) and `:85-114` (LSB): Same pattern
- The shared logic: lattice construction, LLL, row scanning, root recovery

## Commands

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Typecheck | `bun run typecheck`| exit 0   |
| Tests     | `bun run test:unit`| all pass |

## Steps

### Step 1: Create coppersmithLattice helper in _rsaHelpers.ts

Add a Python template helper function that generates the lattice construction code:

```typescript
export function coppersmithLatticePython(opts: {
  f: string;  // polynomial expression in x
  n: string;  // modulus expression
  X: string;  // bound expression
  m: number;  // lattice parameter (default 5)
  t: number;  // lattice parameter (default 5)
}): string {
  // Returns Python code string for Coppersmith lattice construction
  // that constructs the lattice, runs LLL, scans rows, and returns candidate roots
}
```

### Step 2: Refactor simple-lattice.ts to use the helper

Replace the inline lattice construction in both the sageTemplate body and frontendCheck with calls to the helper.

### Step 3: Refactor partial-key-exposure.ts similarly

### Step 4: Refactor partial-pq-bits.ts (both MSB and LSB branches)

### Step 5: Verify

- `bun run typecheck` passes
- `bun run test:unit` passes
- Manual test: run each of the 3 attacks with generated testcases — results should be identical

## Done criteria

- [ ] coppersmithLatticePython helper exists in _rsaHelpers.ts
- [ ] simple-lattice.ts uses the helper
- [ ] partial-key-exposure.ts uses the helper
- [ ] partial-pq-bits.ts uses the helper
- [ ] bun run typecheck exits 0
- [ ] All 3 attacks still produce correct results

## STOP conditions

- The helper changes the lattice parameters in a way that breaks an attack
- The Python code generation differs between the original and refactored versions
