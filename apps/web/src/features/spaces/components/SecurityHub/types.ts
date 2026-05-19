import { type OverviewData } from '../../hooks/useSafeScanContext'

export type ChainEntry = {
  chainId: string
  isDeployed: boolean
}

export type BalanceMap = Record<string, string | undefined>
export type OverviewMap = Record<string, OverviewData>
export type SpaceSafeEntry = {
  address: string
  chainId: string
  name?: string
  isMultichain: boolean
  chainEntries: ChainEntry[]
}

export type SelectedSafe = {
  address: string
  chainId: string
}
