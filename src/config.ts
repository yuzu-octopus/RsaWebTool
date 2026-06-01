// FactorDB CORS proxy URL
// Deploy workers/factordb-proxy.js to Cloudflare Workers, then set URL here:
// Example: "https://factordb-proxy.your-name.workers.dev"
export const FACTORDB_PROXY_URL =
  import.meta.env.VITE_FACTORDB_PROXY_URL ?? "https://factordb-proxy.octopusyuzu.workers.dev"

// Web Worker pool size for frontendCheck computation offloading.
// Fallback to main-thread execution if Workers are unavailable.
// Increase for MagicPanel's parallel frontendCheck execution.
export const WORKER_POOL_SIZE = 3;
