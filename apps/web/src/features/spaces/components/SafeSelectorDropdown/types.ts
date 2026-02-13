import type { ReactNode } from 'react'
import type { SafeInfo } from '@/features/spaces/types'

export interface SafeSelectorDropdownProps {
  safes: SafeInfo[]
  selectedSafeId?: string
  onSafeChange?: (safeId: string) => void
  onChainChange?: (chainId: string) => void
  className?: string
}

export interface SafeInfoDisplayProps {
  name: string
  address: string
  className?: string
}

export interface BalanceDisplayProps {
  balance: string | ReactNode
  threshold: number
  owners: number
  isLoading?: boolean
  showThreshold?: boolean
}

export interface ChainLogoProps {
  chainId: string
  size?: number
}
