/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MONAD_RPC_URL?: string
  readonly VITE_CHOG_SURVIVOR_ADDRESS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
