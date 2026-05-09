import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import type { useCompatibleNetworks } from '@safe-global/utils/features/multichain/hooks/useCompatibleNetworks'
import type { useSafeCreationData } from './hooks/useSafeCreationData'

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
  safeCreationResult: ReturnType<typeof useSafeCreationData>
  replayableChains?: ReturnType<typeof useCompatibleNetworks>
  chain?: Chain
  currentName: string | undefined
  open: boolean
  onClose: () => void
  isUnsupportedSafeCreationVersion?: boolean
}
