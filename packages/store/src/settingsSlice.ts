export type EnvState = {
  tenderly: {
    url: string
    accessToken: string
  }
  rpc: {
    [chainId: string]: string
  }
  /** Co-signer service URL per chain, overriding NEXT_PUBLIC_COSIGNER_SERVICE_URL */
  cosigner?: {
    [chainId: string]: string
  }
}
