# Timer + How to Use Guide

**Date:** 2026-05-26
**Status:** Design

## 1. Timer — Elapsed Time Display

### Problem
While SageCell executes, both InputPanel and MagicPanel show "Running..." and a spinner but give no sense of how long the script has been running. Oracle attacks can take 30-90s — without a timer the user doesn't know if progress is being made.

### Solution: `useTimer` hook

**Location:** `src/hooks/useTimer.ts`

**API:**
```ts
function useTimer(): {
  formatted: string;   // "01:23" padded MM:SS
  start: () => void;   // resets to 0 and starts counting
  stop: () => void;    // pauses the counter
}
```

- Uses `setInterval(1000)` internally, `useCallback` for stable refs
- Cleans up interval on unmount (no leaks)
- `formatted` is re-computed on each tick as `${mm}:${ss}` with zero-padding

### Integration

**InputPanel** (`src/components/InputPanel.tsx`):
- Call `useTimer()` at top of component
- In `handleRun`: call `start()` right after `setLoading(true)`
- In the finally block: call `stop()`
- Display: replace line 244 `Running... click Stop to cancel` with `Running… 01:23 — click Stop to cancel`

**MagicPanel** (`src/components/MagicPanel.tsx`):
- Same pattern: start on `setRunning(true)`, stop in finally block
- Display: replace progress text (line 543) to include timer: `01:23 elapsed — 3/8 completed, 2 running`

### Files Changed
- `src/hooks/useTimer.ts` — new file (30 lines)
- `src/components/InputPanel.tsx` — ~10 lines changed
- `src/components/MagicPanel.tsx` — ~10 lines changed

---

## 2. How to Use Guide

### Problem
17 attacks have non-obvious inputs (oracle responses, structured formats, encoding conventions) that a first-time user wouldn't know how to fill in. The description field is too short to explain, and the proof only covers the math.

### Solution: `usageGuide` field on Attack interface

**Type change** (`src/types/index.ts`):
```ts
export interface Attack {
  // ... existing fields
  usageGuide?: string;  // optional step-by-step plain-text guide
}
```

**Rendering** (`src/components/InputPanel.tsx`):
In the Explanation tab (tab 0), below the proof renderer:
```tsx
{selectedAttack.usageGuide && (
  <>
    <Divider sx={{ borderColor: draculaColors.comment, my: 2 }} />
    <Typography variant="h6" sx={{ color: draculaColors.cyan, mb: 1 }}>
      How to Use
    </Typography>
    <Typography sx={{
      color: draculaColors.foreground,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.8rem',
      whiteSpace: 'pre-wrap',
      lineHeight: 1.6,
    }}>
      {selectedAttack.usageGuide}
    </Typography>
  </>
)}
```

### Content Guidelines

Each usage guide targets someone who knows what RSA is but has never used a specific attack technique. Structure:

1. **One sentence** — what this attack does in plain terms
2. **Input walkthrough** — what each field means, what format it expects
3. **Step-by-step** — how to collect/prepare the inputs
4. **Expected output** — what "success" looks like
5. **Gotchas** — common mistakes, required preconditions

### Attacks with Usage Guides (17)

**Oracle (4):**
- `lsb-oracle` — oracle responses are LSB bits from repeated 2^e blinding; need n.nbits() responses for full recovery
- `biased-lsb` — multi-line oracle CSV for majority-vote; each line is one oracle run
- `bleichenbacher` — PKCS#1 v1.5 padding oracle; responses = padding valid (1) or invalid (0) for consecutive s values
- `manger` — OAEP oracle; responses = 1/0 for consecutive blinded ciphertexts

**Signature/Protocol (3):**
- `bleichenbacher-sig` — `hash_hex` is SHA-1 hash in hex; requires e=3
- `homomorphic-forgery` — `oracle_pairs` format: `m1,s1;m2,s2;...` semicolons between pairs
- `rsa-crt-fault` — needs both valid and faulty signature for same message; input carefully

**Structured Inputs (3):**
- `hastad-linear-pad` — `triples` format: `n1,c1,a1,b1\nn2,c2,a2,b2...` one per line
- `coppersmith-short-pad` — c1/c2 are same message with different short random pads
- `batch-gcd` — `n_values` takes ≥2 moduli (comma or newline separated)

**Non-Obvious Params (7):**
- `partial-pq-bits` — bitPosition = "msb" or "lsb"; knownBits encodes partial p/q knowledge
- `partial-key-exposure` — p_msb trailing zeros encode unknown low bits
- `partial-d` — dLow bit-length defines the k search space; needs at least 1/4 of d bits
- `small-crt-exp` — bound trades off search range vs SageCell timeout
- `known-plaintext` — known_prefix is actual text (e.g. "flag{"); unknown_bits is bit count
- `implicit-key-exposure` — leak = a^p mod n (Fermat's Little Theorem relationship)
- `linearly-related-primes` — k multiplier in q = k·p + δ; tool auto-searches δ

### Files Changed
- `src/types/index.ts` — add `usageGuide?: string` to Attack
- `src/components/InputPanel.tsx` — render usageGuide below proof
- 17 attack files — add usageGuide string

---

## 3. Verification

- `bun run typecheck` — clean (new field is optional)
- `bun run lint` — clean
- `bun run build` — clean
- Playwright test suite — no regressions expected (UI changes only)
- Manual: verify timer appears in both InputPanel and MagicPanel when running
- Manual: verify usage guides render below proof in Explanation tab
