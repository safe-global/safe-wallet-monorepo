import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import type { MultiChainSafeItem } from '@/features/myAccounts/hooks/useAllSafesGrouped'

export interface SafeSetup {
  owners: string[]
  threshold: number
  chainId: string
}

export type SafeOrMultichainSafe = SafeItem | MultiChainSafeItem

export interface CreateSafeOnNewChainForm {
  chainId: string
}

export interface ReplaySafeDialogProps {
  safeAddress: string
  safeCreationResult: any
  replayableChains?: Chain[]
  chain?: Chain
  currentName: string | undefined
  open: boolean
  onClose: () => void
  isUnsupportedSafeCreationVersion?: boolean
}

export interface SafeAddressSelectionProps {
  safeAddress: string
  safeCreationResult: any
  replayableChains?: Chain[]
  chain?: Chain
  currentName: string | undefined
  open: boolean
  onClose: () => void
  isUnsupportedSafeCreationVersion?: boolean
}
