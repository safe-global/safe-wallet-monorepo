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
}

export interface SafeSelectorDropdownProps {
  items: SafeItemData[]
  selectedItemId?: string
  onItemSelect?: (itemId: string) => void
  onChainChange?: (chainId: string) => void
}
