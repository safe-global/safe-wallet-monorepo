import { useCallback } from 'react'
import {
  useBillingUpdateSubscriptionV1Mutation,
  useLazyBillingPreviewSubscriptionUpdateV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { isPlanChangeable } from './subscription'
import { useBillingSpaceId } from './useBillingSpaceId'
import { useSpaceSubscription } from './useSpaceSubscription'

/**
 * Moves a live subscription onto another offered plan: `previewChange` fetches the prorated cost, `changePlan`
 * applies it. The PATCH needs a fresh second factor; the store's elevation listener handles the step-up and
 * replays the request on return, so callers only need to tolerate an `elevation_required` rejection.
 */
export const useChangePlan = (spaceId?: string | null) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const { subscription, status } = useSpaceSubscription(spaceId)
  const [triggerPreview, preview] = useLazyBillingPreviewSubscriptionUpdateV1Query()
  const [update, change] = useBillingUpdateSubscriptionV1Mutation()
  const subscriptionId = gatedSpaceId && isPlanChangeable(status) ? subscription?.id : undefined
  const canChange = subscriptionId !== undefined

  const previewChange = useCallback(
    (priceId: string) => {
      if (!gatedSpaceId || !subscriptionId) return
      void triggerPreview({ spaceId: gatedSpaceId, subscriptionId, planId: priceId })
    },
    [gatedSpaceId, subscriptionId, triggerPreview],
  )

  const changePlan = useCallback(
    async (priceId: string, paymentLinkId: string): Promise<boolean> => {
      if (!gatedSpaceId || !subscriptionId) return false
      const result = await update({
        spaceId: gatedSpaceId,
        subscriptionId,
        updateSubscriptionDto: { planId: priceId, paymentLinkId },
      })
      return !('error' in result)
    },
    [gatedSpaceId, subscriptionId, update],
  )

  return {
    canChange,
    previewChange,
    preview: preview.data,
    isPreviewing: preview.isFetching,
    previewError: preview.error,
    changePlan,
    isChanging: change.isLoading,
    changeError: change.error,
  }
}
