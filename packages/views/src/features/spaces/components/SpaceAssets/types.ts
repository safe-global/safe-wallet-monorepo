export type AssetTokenRow = {
  id: string
  name: string
  symbol: string
  logoUri?: string
  amount: string
  value: string
}

export type AssetPositionRow = {
  id: string
  name: string
  protocol: string
  protocolLogoUri?: string | null
  /** Deposited, staked, reward… */
  type: string
  amount: string
  value: string
}

export type ChainAssetsState = 'loading' | 'error' | 'ready' | 'inactive' | 'unsupported'
