import type { listenerMiddlewareInstance } from '@/store/index'
import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { syncPlanChange } from '../hooks/billing/syncPlanChange'

/** Watches the mutation rather than its caller, so a change replayed after step-up syncs too. */
export const planChangeSyncListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  const changed = billingApi?.endpoints?.billingUpdateSubscriptionV1?.matchFulfilled
  // Tests that mock the billing module leave no endpoint to watch.
  if (!changed) return

  listenerMiddleware.startListening({
    matcher: changed,
    effect: (action, { dispatch }) => {
      const { spaceId, updateSubscriptionDto } = action.meta.arg.originalArgs
      void syncPlanChange(dispatch, spaceId, updateSubscriptionDto.planId)
    },
  })
}
