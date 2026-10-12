import { formatDate } from '@safe-global/utils/utils/date'
import { isSpaceDeletionBlocked } from './subscription'
import { useSpaceSubscription } from './useSpaceSubscription'

export const SUBSCRIPTION_CHECK_FAILED_MESSAGE =
  "We couldn't check this Workspace's subscription. Please try again later to delete it."

export const getDeletionBlockedReason = (cancelAt: number | null | undefined): string =>
  cancelAt
    ? `The subscription is set to cancel on ${formatDate(cancelAt * 1000)}. You can delete this Workspace once the cancellation is complete.`
    : 'Cancel the subscription before deleting this Workspace.'

type SpaceDeletionGuard = {
  isDeletionBlocked: boolean
  blockedReason?: string
}

/** Deleting a Workspace is only allowed without a subscription Stripe could still bill. */
export const useSpaceDeletionGuard = (spaceId: string | null): SpaceDeletionGuard => {
  const { subscription, status, isLoading, isError, hasData } = useSpaceSubscription(spaceId)

  if (isLoading) return { isDeletionBlocked: true }
  if (isError && !hasData) return { isDeletionBlocked: true, blockedReason: SUBSCRIPTION_CHECK_FAILED_MESSAGE }
  if (isSpaceDeletionBlocked(status)) {
    return { isDeletionBlocked: true, blockedReason: getDeletionBlockedReason(subscription?.cancelAt) }
  }

  return { isDeletionBlocked: false }
}
