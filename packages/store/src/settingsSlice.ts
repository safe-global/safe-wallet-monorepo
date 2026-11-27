export type EnvState = {
  tenderly: {
    url: string
    accessToken: string
    publicSharing?: boolean
  }
  rpc: {
    [chainId: string]: string
  }
}
