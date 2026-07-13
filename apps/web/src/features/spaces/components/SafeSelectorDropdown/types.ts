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

/** Safe picked for renaming via the row's pencil button. */
export interface SafeRenameTarget {
  address: string
  name: string
  chainIds: string[]
}

export interface SafeSelectorDropdownProps {
  /** Full set of safes used to resolve the trigger's current safe (union of both tabs). */
  items: SafeItemData[]
  /** Safes rendered inside the popup list. Defaults to `items`; the SafeBar passes the active tab's list. */
  listItems?: SafeItemData[]
  selectedItemId?: string
  onItemSelect?: (itemId: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  header?: React.ReactNode
  footer?: React.ReactNode | ((close: () => void) => React.ReactNode)
  /**
   * Replaces the default "no safes" empty state — e.g. a "Sign in to a workspace" CTA on the Workspace
   * tab. Pass a function to receive a `close` callback (dismisses the dropdown before running an action).
   */
  emptyStateOverride?: React.ReactNode | ((close: () => void) => React.ReactNode)
  /** Controlled search query. When provided the owner filters/counts across tabs with the same query. */
  searchValue?: string
  onSearchValueChange?: (value: string) => void
  /** Enables the rename pencil on list rows; the dropdown stays open behind the rename dialog. */
  onItemRename?: (target: SafeRenameTarget) => void
  /**
   * Keeps the dropdown open while a modal is layered on top of it (e.g. the rename dialog), so the
   * user doesn't lose their place. Suppresses base-ui's close-on-outside-interaction.
   */
  keepOpen?: boolean
  /**
   * Enables drag-to-reorder for the list (only passed under Manual sort). Fired on drop with the
   * reordered top-level addresses, in display order.
   */
  onReorder?: (orderedAddresses: string[]) => void
}
