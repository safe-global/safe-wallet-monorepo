import type { ChainInfo } from '@/features/spaces/types'

export interface SafeItemDataChain extends ChainInfo {
  /** Per-chain fiat total for this safe. Populated for multi-chain items so the accordion can show chain balances. */
  balance?: string
  /** True while the per-chain overview is still being fetched. */
  isLoading?: boolean
  /** Number of queued/pending transactions on this chain. */
  queued?: number
  /** True when the user cannot sign on this chain (not an owner / watch-only). */
  isReadOnly?: boolean
  /** True when the safe is counterfactual on this chain and has not been deployed yet. */
  isUndeployed?: boolean
  /** True while a counterfactual safe on this chain is being activated. */
  isActivating?: boolean
}

export interface SafeItemData {
  id: string
  name: string
  address: string
  threshold: number
  owners: number
  chains: SafeItemDataChain[]
  balance: string
  isLoading?: boolean
  parentSafeId?: string
}

export interface SafeSelectorDropdownProps {
  items: SafeItemData[]
  selectedItemId?: string
  onItemSelect?: (itemId: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  header?: React.ReactNode
  footer?: React.ReactNode | ((close: () => void) => React.ReactNode)
  /** When provided, an always-visible "Manage trusted Safes" action is shown above the dropdown footer. */
  onManageTrustedSafes?: () => void
}
