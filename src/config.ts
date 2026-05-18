// FactorDB CORS proxy URL
// Deploy workers/factordb-proxy.js to Cloudflare Workers, then set URL here:
// Example: "https://factordb-proxy.your-name.workers.dev"
export const FACTORDB_PROXY_URL =
  import.meta.env.VITE_FACTORDB_PROXY_URL ?? "https://factordb-proxy.octopusyuzu.workers.dev"
