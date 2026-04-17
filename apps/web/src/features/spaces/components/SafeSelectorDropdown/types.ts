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
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  header?: React.ReactNode
  footer?: React.ReactNode | ((close: () => void) => React.ReactNode)
}
