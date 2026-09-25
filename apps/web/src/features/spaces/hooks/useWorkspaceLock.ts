import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useIsInvited } from './useSpaceMembers'
import { useSpacePlan } from './useSpacePlan'
import { useSpaceOffers } from './billing/useSpaceOffers'
import { getSubscriptionEndedAt, isLivePlanStatus } from './billing/subscription'

/** Why a Workspace is locked: it can still claim its free access, its last payment failed, or its plan ended. */
export type WorkspaceLockReason = 'trial-offered' | 'payment-failed' | 'lapsed'

/** A Workspace without a live subscription (never, canceled, unpaid or pending) is locked behind a blocking modal. */
export const useWorkspaceLock = (spaceId?: string | null) => {
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const isInvited = useIsInvited()
  const {
    status,
    latestSubscription,
    isLoading: isPlanLoading,
    isUninitialized: isPlanUninitialized,
    isError: isPlanError,
    refetch: refetchPlan,
  } = useSpacePlan(spaceId)
  const {
    trialPeriodDays,
    isLoading: isOffersLoading,
    isUninitialized: isOffersUninitialized,
    isError: isOffersError,
    refetch: refetchOffers,
  } = useSpaceOffers(spaceId)
  const applies = isSafePro && !isInvited
  // A query that has not started yet (first render after the space id appears, or skipped while signed out) reads as
  // "no plan, no offers"; treating it as resolving keeps the lock from firing, or navigating away, on stale emptiness.
  const isResolving =
    applies && (isPlanLoading || isOffersLoading || Boolean(isPlanUninitialized) || Boolean(isOffersUninitialized))
  // A failed source reads as "no plan" too; that is a reason to ask for a retry, never to lock.
  const isError = applies && !isResolving && Boolean(isPlanError || isOffersError)
  const reason: WorkspaceLockReason =
    trialPeriodDays !== null ? 'trial-offered' : status === 'payment_failed' ? 'payment-failed' : 'lapsed'

  return {
    isLocked: applies && !isResolving && !isError && !isLivePlanStatus(status),
    isResolving,
    isError,
    retry: () => {
      refetchPlan()
      void refetchOffers()
    },
    trialPeriodDays,
    reason,
    endedAt: reason === 'lapsed' ? getSubscriptionEndedAt(latestSubscription) : null,
  }
}
