/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FACTORDB_PROXY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
