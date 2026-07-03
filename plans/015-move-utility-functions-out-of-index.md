# Plan 015: Move utility functions out of attack index.ts

## Status
- Priority: P3
- Effort: S
- Risk: LOW
- Depends on: none
- Category: tech-debt
- Planned at: 08e26cc, 2026-07-03

## Why this matters

index.ts serves as both the attack registry barrel AND contains business logic (submitToFactorDB, autoDecrypt). Mixing barrel exports with business logic in a 200-line file makes it harder to reason about. These utilities could live in a dedicated module.

## Current state

- `src/attacks/index.ts:151-164`: submitToFactorDB function
- `src/attacks/index.ts:171-199`: autoDecrypt function
- Both consumed by useMagicExecution.ts alongside the attacks array

## Commands

| Purpose   | Command            | Expected |
|-----------|--------------------|----------|
| Typecheck | `bun run typecheck`| exit 0   |

## Steps

### Step 1: Create src/attacks/utils.ts

Move submitToFactorDB and autoDecrypt to a new file:

```typescript
// src/attacks/utils.ts
import { extractPQ, reportFactor } from '../utils/factordb';
import env from '../config/env';
import { modInverse, modPow } from '../utils/bigint';
import { bigIntToBytes } from '../utils/converters';
import type { Attack } from '../types';
import { attacksByCategory } from './index';

export function submitToFactorDB(...) { ... }
export function autoDecrypt(...) { ... }
```

### Step 2: Update index.ts to re-export from utils.ts

```typescript
export { submitToFactorDB, autoDecrypt } from './utils';
```

### Step 3: Update consumers

Check if useMagicExecution.ts imports these from index.ts — if so, the re-export handles it. If any file imports directly, update the import path.

### Step 4: Verify

- `bun run typecheck` passes
- No circular dependency between index.ts and utils.ts

## Done criteria

- [ ] src/attacks/utils.ts exists with submitToFactorDB and autoDecrypt
- [ ] index.ts re-exports from utils.ts
- [ ] bun run typecheck exits 0
- [ ] No circular dependencies
