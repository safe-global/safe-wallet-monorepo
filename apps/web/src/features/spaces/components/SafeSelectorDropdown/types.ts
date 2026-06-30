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
  /** Contextual list used for the trigger + current-safe selection. */
  items: SafeItemData[]
  /** Safes in the current workspace (Workspace tab). Defaults to `items`. */
  workspaceItems?: SafeItemData[]
  /** Trusted (pinned) safes (Local tab). Defaults to `items`. */
  localItems?: SafeItemData[]
  /** Whether a workspace is available; when false the Workspace tab shows a sign-in prompt. */
  hasWorkspace?: boolean
  /** Current workspace name; labels the Workspace tab (falls back to "Workspace"). */
  workspaceName?: string
  isInSpaceContext?: boolean
  selectedItemId?: string
  onItemSelect?: (itemId: string) => void
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  /** Opens the Manage Trusted Safes modal (Local tab). */
  onManageTrustedSafes?: () => void
  /** Navigates to the workspace sign-in page (Workspace tab prompt). */
  onSignIn?: () => void
}
