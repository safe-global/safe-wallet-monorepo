export type EnvState = {
  tenderly: {
    url: string
    accessToken: string
  }
  rpc: {
    [chainId: string]: string
  }
}
