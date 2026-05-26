import type { SafeItem } from '@/hooks/safes'

export interface SafeAppMockupAccount {
  address: string
  name?: string
  fiatValue?: string
  /** Used by the mockup to fetch live fiat data per row. */
  _safeItem?: SafeItem
}

export interface SafeAppMockupProps {
  name: string
  highlight: 'switcher' | 'accounts' | 'none'
  accounts?: SafeAppMockupAccount[]
  /**
   * One SafeItem per chain. Multi-chain Safes contribute multiple entries so the
   * aggregated total sums across networks rather than showing a single-chain value.
   */
  balanceSafes?: SafeItem[]
}
