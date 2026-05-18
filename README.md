# RSA CTF Tool

A browser-only RSA cryptography analysis tool powered by SageMathCell, designed for CTF challenges and educational use.

[**Live Demo**](https://yuzu-octopus.github.io/RsaWebTool/)

## Features

- **47 attack implementations** across 5 categories
- **Real-time SageMath execution** via embedded SageMathCell
- **Browser-side pre-checks** — 4 attacks run entirely in the browser (no SageCell needed)
- **FactorDB integration** — CORS-proxied API for instant factor lookups
- **Magic Cracker** — paste any RSA parameters and auto-run all applicable attacks
- **Mathematical proofs** — every attack includes a formal proof rendered with KaTeX
- **Dracula theme** — full dark mode with JetBrains Mono typography

## Attack Categories

| Category | Count | Highlights |
|----------|-------|------------|
| **Factorization** | 17 | Fermat, Wiener, Boneh-Durfee, ECM, Pollard p-1, Pollard rho, Williams p+1, SQUFOF, Quadratic Sieve, Batch GCD, Multi-Prime, and more |
| **Partial Key / Lattice** | 7 | Simple Lattice, Partial d, Partial p/q Bits, Small CRT Exp, dp/dq Leak, Linearly Related Primes, Dependent Prime |
| **Message / Protocol** | 12 | Common Modulus, Hastad, Franklin-Reiter, Coppersmith Short Pad, LSB Oracle, RSA-CRT Fault, Homomorphic Forgery, and more |
| **Oracle** | 3 | Bleichenbacher PKCS#1 v1.5, Manger OAEP, Biased LSB |
| **Advanced** | 8 | ROCA, Nitros, FactorDB Lookup, Known Plaintext, Small Public Exp, Phi(n) Leak, Parity Oracle |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (GitHub Pages)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │ Sidebar  │  │ Input/   │  │ OutputPanel           │  │
│  │          │  │ Magic    │  │ Results + Converters  │  │
│  │ Attack   │→ │ Panel    │→ │ History               │  │
│  │ Tree     │  │          │  │                       │  │
│  └──────────┘  └────┬─────┘  └───────────────────────┘  │
│                     │                                    │
│          ┌──────────┴──────────┐                        │
│          │                     │                        │
│   ┌──────▼──────┐    ┌────────▼─────────┐              │
│   │ frontendCheck│    │ SageMathCell     │              │
│   │ (browser)   │    │ (embedded JS)    │              │
│   │             │    │                  │              │
│   │ • FactorDB  │    │ Pure math code   │              │
│   │ • Phi(n)    │    │ No internet      │              │
│   │ • Batch GCD │    │ (firewall 2021)  │              │
│   │ • Common F. │    │                  │              │
│   └─────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────┘
         │
         │ CORS proxy (Cloudflare Worker)
         ▼
┌──────────────────┐
│ FactorDB API     │
│ factordb.com/api │
└──────────────────┘
```

### Key Design Decisions

- **Browser-only** — no backend server. All computation happens client-side.
- **SageMathCell embedded JS** — the `/service` REST API is dead (Cloudflare 520). The `makeSagecell` embedded script is the only working path.
- **FactorDB CORS proxy** — FactorDB API has no CORS headers. A Cloudflare Worker at `factordb-proxy.octopusyuzu.workers.dev` adds `Access-Control-Allow-Origin: *`.
- **frontendCheck pattern** — attacks can define an optional async pre-check that runs in the browser before falling back to SageCell. This enables instant results for FactorDB lookups, Phi(n) recovery, and BigInt GCD operations.
- **Pure math templates** — SageMathCell has no internet access (firewall since 2021). All attack templates must be self-contained math code.

## Local Development

```bash
bun install
bun run dev      # starts dev server on port 5173
bun run build    # outputs to docs/ for GitHub Pages
```

## Deployment

Build output goes to `docs/`. GitHub Pages auto-deploys from this directory on every push to `main`.

```bash
bun run build
git add -A && git commit -m "..."
git push origin main
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 + Rollup (Rolldown) |
| UI | Material UI 9 |
| Math Rendering | KaTeX 0.16 |
| Code Highlighting | react-syntax-highlighter (Dracula) |
| Math Engine | SageMathCell (embedded makeSagecell) |
| External API | FactorDB (via Cloudflare Worker CORS proxy) |
| Hosting | GitHub Pages |

## Security Disclaimer

This tool is designed for **CTF challenges and educational purposes only**. Do not use it against systems you do not have explicit permission to test. RSA cryptography is widely used in production systems — unauthorized access is illegal.

## License

MIT
