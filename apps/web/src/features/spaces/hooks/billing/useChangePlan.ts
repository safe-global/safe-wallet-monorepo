import { useCallback } from 'react'
import {
  useBillingUpdateSubscriptionV1Mutation,
  useLazyBillingPreviewSubscriptionUpdateV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppDispatch } from '@/store'
import type { SafeRef } from '../../components/Plans/types'
import { isPlanChangeable } from './subscription'
import { useBillingSpaceId } from './useBillingSpaceId'
import { useSpaceSubscription } from './useSpaceSubscription'

/**
 * The elevation listener steps up the PATCH's second factor and replays it; callers tolerate `elevation_required`.
 * `removedSafes` leave the Workspace in the same request, before the plan changes.
 */
export const useChangePlan = (spaceId?: string | null) => {
  const gatedSpaceId = useBillingSpaceId(spaceId)
  const dispatch = useAppDispatch()
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
    async (priceId: string, paymentLinkId: string, removedSafes: SafeRef[] = []): Promise<boolean> => {
      if (!gatedSpaceId || !subscriptionId) return false
      const result = await update({
        spaceId: gatedSpaceId,
        subscriptionId,
        updateSubscriptionDto: {
          planId: priceId,
          paymentLinkId,
          ...(removedSafes.length > 0 && { removedSafes }),
        },
      })
      if (removedSafes.length > 0) dispatch(spacesApi.util.invalidateTags(['spaces']))
      return !('error' in result)
    },
    [gatedSpaceId, subscriptionId, update, dispatch],
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
