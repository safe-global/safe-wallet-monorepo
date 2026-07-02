import { useAppSelector } from '@/src/store/hooks'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import {
  useRelayGetRelaysRemainingV1Query,
  type RelaysRemaining,
} from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { txRequiresRelay } from '@/src/features/ExecuteTx/components/ReviewAndExecute/helpers'

export interface RequiresRelayState {
  requiresRelay: boolean
  isRelayEnabled: boolean
  isRelayAvailable: boolean
  isLoadingRelays: boolean
  relaysRemaining?: RelaysRemaining
}

/**
 * Single source of truth for relay gating, shared by the "choose how to execute" sheet and the
 * review screen so they can't drift apart. Safe-pays txs bypass the daily quota — the Safe itself
 * funds the fee — so the relay option is available whenever the chain supports relaying.
 */
export const useRequiresRelay = (txDetails?: TransactionDetails): RequiresRelayState => {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const { data: relaysRemaining, isLoading: isLoadingRelays } = useRelayGetRelaysRemainingV1Query({
    chainId: activeSafe.chainId,
    safeAddress: activeSafe.address,
  })

  const requiresRelay = txRequiresRelay(txDetails)
  const isRelayEnabled = hasFeature(activeChain, FEATURES.RELAYING)
  const isRelayAvailable = requiresRelay
    ? isRelayEnabled
    : Boolean(relaysRemaining?.remaining && relaysRemaining.remaining > 0)

  return { requiresRelay, isRelayEnabled, isRelayAvailable, isLoadingRelays, relaysRemaining }
}
