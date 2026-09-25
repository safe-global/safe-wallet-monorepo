import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { safeSpaceKey, useSafeSpaces } from '@/hooks/useSafeSpaces'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { SponsoredTxsMeter } from './billing/types'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useSpacePlan } from './useSpacePlan'

export type SafeSponsoredTxs = {
  /** SAFE_PRO is on for this chain: the transaction flow talks about sponsored transactions and Safe Pro. */
  isEnabled: boolean
  /** The current Safe sits in a Workspace with a live plan, so its sponsored transactions come from that plan. */
  isPro: boolean
  meter: SponsoredTxsMeter | null
  /** Sponsored transactions left in the cycle; null when the plan sets no cap or the Safe is not on a plan. */
  left: number | null
  /** The Workspace whose allowance pays for a relay; null unless the Safe is on a plan. */
  spaceId: string | null
  canSponsor: boolean
  isLoading: boolean
}

/** The sponsored-transactions allowance of the Workspace the current Safe belongs to, if it belongs to one. */
export const useSafeSponsoredTxs = (): SafeSponsoredTxs => {
  const isEnabled = useHasFeature(FEATURES.SAFE_PRO) === true
  const { safe, safeAddress } = useSafeInfo()
  const { safeSpaces, isLoading: isSpacesLoading } = useSafeSpaces(!isEnabled)
  const currentSpaceId = useCurrentSpaceId()
  // Only the current Workspace counts, whatever other Workspaces hold the Safe.
  const holders =
    isEnabled && safeAddress && safe.chainId ? (safeSpaces[safeSpaceKey(safe.chainId, safeAddress)] ?? []) : []
  const spaceId = currentSpaceId && holders.some((space) => space.uuid === currentSpaceId) ? currentSpaceId : null
  const { plan, sponsoredTxs, isLoading: isPlanLoading } = useSpacePlan(spaceId)

  const isPro = isEnabled && spaceId !== null && plan !== null && sponsoredTxs !== null
  const left = isPro && sponsoredTxs.quota !== null ? Math.max(sponsoredTxs.quota - sponsoredTxs.used, 0) : null

  return {
    isEnabled,
    isPro,
    meter: isPro ? sponsoredTxs : null,
    left,
    spaceId: isPro ? spaceId : null,
    canSponsor: isPro && (left === null || left > 0),
    isLoading: isEnabled && (isSpacesLoading || (spaceId !== null && isPlanLoading)),
  }
}
