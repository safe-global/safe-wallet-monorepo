import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useIsInvited } from './useSpaceMembers'
import { useSpacePlan } from './useSpacePlan'
import { useSpaceOffers } from './billing/useSpaceOffers'

/** A Workspace without a live subscription (never, canceled, unpaid or pending) is locked behind the Home takeover. */
export const useWorkspaceLock = (spaceId?: string | null) => {
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const isInvited = useIsInvited()
  const { status, isLoading: isPlanLoading } = useSpacePlan(spaceId)
  const { trialPeriodDays, isLoading: isOffersLoading } = useSpaceOffers(spaceId)
  const applies = isSafePro && !isInvited
  const isResolving = applies && (isPlanLoading || isOffersLoading)

  return {
    isLocked: applies && !isResolving && status !== 'trialing' && status !== 'active',
    isResolving,
    trialPeriodDays,
  }
}
