import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

export type ChainInfo = Pick<Chain, 'chainId' | 'chainName' | 'chainLogoUri' | 'shortName'>

export interface SafeInfo {
  id: string
  name: string
  address: string
  threshold: number
  owners: number
  balance: string
  chains: ChainInfo[]
}
