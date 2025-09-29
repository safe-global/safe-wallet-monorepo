import ExternalStore from '@safe-global/utils/services/ExternalStore'

import type { AppInfo } from '@/services/safe-wallet-provider'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'

export type WcChainSwitchRequest = {
  appInfo: AppInfo
  chain: ChainInfo
  safes: SafeItem[]
  onSelectSafe: (safe: SafeItem) => Promise<void>
  onCancel: () => void
}

export const wcChainSwitchStore = new ExternalStore<WcChainSwitchRequest | undefined>(undefined)
