import { skipToken } from '@reduxjs/toolkit/query'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useIsInvited } from './useSpaceMembers'
import { useSpaceSubscription } from './billing/useSpaceSubscription'
import { useSpaceOffers } from './billing/useSpaceOffers'
import { getSubscriptionEndedAt } from './billing/subscription'

/** A Workspace that had a plan: its last payment failed, or the plan ended. */
export type PlanLockReason = 'payment-failed' | 'lapsed'

/** Why a Workspace is locked: its onboarding is not finished, it can still claim its free access, or a plan reason. */
export type WorkspaceLockReason = 'setup-pending' | 'trial-offered' | PlanLockReason

/** The first reason that holds, in the order the lock handles them. A live Workspace is not locked at all. */
const lockReason = (state: {
  isSetupPending: boolean
  isTrialOffered: boolean
  hasPaymentFailed: boolean
}): WorkspaceLockReason => {
  if (state.isSetupPending) return 'setup-pending'
  if (state.isTrialOffered) return 'trial-offered'
  if (state.hasPaymentFailed) return 'payment-failed'
  return 'lapsed'
}

/** A Workspace without a live subscription (never, canceled, unpaid or pending) is locked behind a blocking modal. */
export const useWorkspaceLock = (spaceId?: string | null) => {
  const isSafePro = useIsSafeProEnabled()
  const isInvited = useIsInvited()
  const subscription = useSpaceSubscription(spaceId)
  const offers = useSpaceOffers(spaceId)
  const applies = isSafePro && !isInvited
  const space = useSpacesGetOneV1Query(applies && spaceId ? { id: spaceId } : skipToken)
  // An uninitialized query reads as "no plan, no offers"; resolving keeps the lock from firing on stale emptiness.
  const isResolving =
    applies &&
    (subscription.isLoading ||
      offers.isLoading ||
      space.isLoading ||
      Boolean(subscription.isUninitialized) ||
      Boolean(offers.isUninitialized))
  const isLive = subscription.status === 'trialing' || subscription.status === 'active'
  // Only a failure with no last-known response leaves the lock guessing; offers only matter to a Workspace that is not live.
  const isError =
    applies &&
    !isResolving &&
    Boolean((subscription.isError && !subscription.hasData) || (!isLive && offers.isError && !offers.hasData))
  const reason = lockReason({
    isSetupPending: space.currentData?.setupStatus === 'pending',
    isTrialOffered: offers.trialPeriodDays !== null,
    hasPaymentFailed: subscription.status === 'payment_failed',
  })

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
