# ADR 001: Use SageMathCell for math-heavy attacks instead of local WASM

## Status

Accepted

## Context

42 of 47 attacks require advanced number theory operations (LLL lattice reduction, ECM factorization, quadratic sieve, Coppersmith methods) that are impractical to implement in browser JavaScript. SageMathCell provides a full SageMath kernel via an embedded offscreen iframe, giving access to SAGE's extensive mathematical library without requiring users to install anything.

The alternative was compiling SageMath to WebAssembly, but this would result in a 50+ MB bundle download and slow cold starts. SageMathCell loads on demand and is cached by the browser.

## Decision

Use SageMathCell as the math backstop for attacks that can't run in pure JavaScript. The 5 pure-TypeScript attacks (batch-gcd, common-prime-rsa, factordb-lookup, implicit-key-exposure, multi-prime-gcd) and 31 attacks with `frontendCheck` run entirely in the browser. The remaining 42 attacks use SageMath templates that are injected into the SageMathCell kernel.

## Consequences

- Requires network access to load the SageMathCell script (firewalled since 2021, so no external network from the kernel)
- 3 concurrent execution slots, 120s hard timeout, 30s stall detection
- Attack templates must be self-contained Python — no pip installs or network from the kernel
- Users without network can still use the 31 frontendCheck attacks
