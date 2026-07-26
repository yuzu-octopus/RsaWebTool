# FactorDB CORS Proxy — Cloudflare Worker

## Deploy

Requires Bun 1.3.14+ and a Cloudflare account.

```bash
cd workers
bun install --frozen-lockfile
bun run login
bun run deploy
```

`bun run deploy` resolves locked local `wrangler`; it does not fetch a fresh version.

## Configure client

The application reads its default proxy URL from `DEFAULTS.factordbProxyUrl` in
`src/config/env.ts`. Replace that value with deployed Worker URL before building
the client. For a temporary browser-only override, run:

```js
window.env.factordbProxyUrl = 'https://factordb-proxy.<account>.workers.dev'
```

The override persists in browser `localStorage`.

## Develop and test

```bash
bun run dev
curl "http://localhost:8787?query=12345"
```
