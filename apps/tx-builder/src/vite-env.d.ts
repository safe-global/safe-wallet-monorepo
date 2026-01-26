/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TENDERLY_ORG_NAME: string
  readonly VITE_TENDERLY_PROJECT_NAME: string
  readonly VITE_TENDERLY_SIMULATE_ENDPOINT_URL: string
  readonly VITE_ETHERSCAN_API_KEY: string
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
