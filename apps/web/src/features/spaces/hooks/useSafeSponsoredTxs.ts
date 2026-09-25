import type { RelaysRemaining } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { hasRemainingRelays } from '@/utils/relaying'
import type { SponsoredTxsMeter } from './billing/types'
import { useSafeProAccess } from './useSafeProAccess'
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
  /** The Workspace can still sponsor a transaction right now. */
  canSponsor: boolean
  /** The Safe is on a plan whose allowance is spent for this cycle. */
  isExhausted: boolean
  isLoading: boolean
}

/** The sponsored-transactions allowance of the Workspace the current Safe belongs to, if it belongs to one. */
export const useSafeSponsoredTxs = (): SafeSponsoredTxs => {
  const { isSafePro: isEnabled, hasProFeatures, spaceId, isLoading } = useSafeProAccess()
  const { sponsoredTxs } = useSpacePlan(spaceId)

  const isPro = isEnabled && hasProFeatures && sponsoredTxs !== null
  const left = isPro && sponsoredTxs.quota !== null ? Math.max(sponsoredTxs.quota - sponsoredTxs.used, 0) : null

  return {
    isEnabled,
    isPro,
    meter: isPro ? sponsoredTxs : null,
    left,
    spaceId: isPro ? spaceId : null,
    canSponsor: isPro && (left === null || left > 0),
    isExhausted: isPro && left === 0,
    isLoading,
  }
}

/** A Safe on a plan relays against its Workspace's allowance; any other Safe against the chain's daily relays. */
export const canRelayWith = (sponsoredTxs: SafeSponsoredTxs, relays?: RelaysRemaining): boolean =>
  sponsoredTxs.isPro ? sponsoredTxs.canSponsor : hasRemainingRelays(relays)
