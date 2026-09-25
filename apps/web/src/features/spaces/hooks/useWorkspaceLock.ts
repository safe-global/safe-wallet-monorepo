import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useIsInvited } from './useSpaceMembers'
import { useSpaceSubscription } from './billing/useSpaceSubscription'
import { useSpaceOffers } from './billing/useSpaceOffers'
import { getSubscriptionEndedAt } from './billing/subscription'

/** Why a Workspace is locked: it can still claim its free access, its last payment failed, or its plan ended. */
export type WorkspaceLockReason = 'trial-offered' | 'payment-failed' | 'lapsed'

/** A Workspace without a live subscription (never, canceled, unpaid or pending) is locked behind a blocking modal. */
export const useWorkspaceLock = (spaceId?: string | null) => {
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const isInvited = useIsInvited()
  const subscription = useSpaceSubscription(spaceId)
  const offers = useSpaceOffers(spaceId)
  const applies = isSafePro && !isInvited
  // An uninitialized query reads as "no plan, no offers"; resolving keeps the lock from firing on stale emptiness.
  const isResolving =
    applies &&
    (subscription.isLoading ||
      offers.isLoading ||
      Boolean(subscription.isUninitialized) ||
      Boolean(offers.isUninitialized))
  const isLive = subscription.status === 'trialing' || subscription.status === 'active'
  // Only a failure with no last-known response leaves the lock guessing; offers only matter to a Workspace that is not live.
  const isError =
    applies &&
    !isResolving &&
    Boolean((subscription.isError && !subscription.hasData) || (!isLive && offers.isError && !offers.hasData))
  const reason: WorkspaceLockReason =
    offers.trialPeriodDays !== null
      ? 'trial-offered'
      : subscription.status === 'payment_failed'
        ? 'payment-failed'
        : 'lapsed'

  return {
    isLocked: applies && !isResolving && !isError && !isLive,
    isResolving,
    isError,
    retry: () => {
      void subscription.refetch()
      void offers.refetch()
    },
    trialPeriodDays: offers.trialPeriodDays,
    reason,
    endedAt: reason === 'lapsed' ? getSubscriptionEndedAt(subscription.latestSubscription) : null,
  }
}
