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
  type: string
  amount: string
  value: string
}

export type AssetProtocolRow = {
  id: string
  name: string
  logoUri?: string | null
  value: string
  positions: AssetPositionRow[]
}

export type ChainAssetsState = 'loading' | 'error' | 'ready' | 'inactive' | 'unsupported'
