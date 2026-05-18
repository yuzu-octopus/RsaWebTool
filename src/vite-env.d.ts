/// <reference types="vite/client" />

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_FACTORDB_PROXY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
