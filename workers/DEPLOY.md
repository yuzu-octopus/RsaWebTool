# FactorDB CORS Proxy — Cloudflare Worker

## Deploy

Requires Node.js + npm (to install wrangler).

```bash
cd workers
npm install
npx wrangler deploy
```

If first time, run `npx wrangler login` first.

After deploy, copy the worker URL (e.g. `https://factordb-proxy.your-name.workers.dev`) into:

```
src/config.ts → FACTORDB_PROXY_URL
```

## Dev

```bash
npx wrangler dev
```

## Test

```bash
curl "http://localhost:8787?query=12345"
```
