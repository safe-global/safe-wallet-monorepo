import type { ChainInfo } from '@/features/spaces/types'

export interface SafeItemData {
  id: string
  name: string
  address: string
  threshold: number
  owners: number
  chains: ChainInfo[]
  balance: string
  isLoading?: boolean
  parentSafeId?: string
}

export interface SafeSelectorDropdownProps {
  items: SafeItemData[]
  selectedItemId?: string
  onItemSelect?: (itemId: string) => void
  isError?: boolean
  onRetry?: () => void
  header?: React.ReactNode
  // TODO: When SafeSelectionModal is migrated to shadcn (Radix UI), the Radix
  // DismissableLayer will automatically close this dropdown when the modal opens
  // (same behaviour as AccountsModal today). At that point, revert this back to
  // `React.ReactNode` and remove the explicit `close()` call in SpaceSafeBar.
  footer?: (close: () => void) => React.ReactNode
}
