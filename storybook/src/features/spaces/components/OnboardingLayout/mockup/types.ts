import type { SafeItem } from '@/hooks/safes'

export interface SafeAppMockupAccount {
  address: string
  name?: string
  fiatValue?: string
  _safeItem?: SafeItem
}

export interface SafeAppMockupProps {
  name: string
  highlight: 'switcher' | 'accounts' | 'none'
  accounts?: SafeAppMockupAccount[]
  // One entry per chain — multi-chain Safes contribute multiple so the total sums across networks.
  balanceSafes?: SafeItem[]
}
