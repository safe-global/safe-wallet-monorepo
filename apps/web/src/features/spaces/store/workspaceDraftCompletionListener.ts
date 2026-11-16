import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import type { listenerMiddlewareInstance } from '@/store/index'
import { getPlanStatus, isLivePlanStatus, selectCurrentSubscription } from '../hooks/billing/subscription'
import { clearWorkspaceDraft, selectStoredWorkspaceDraft } from './workspaceDraftSlice'

/** Once the draft's Workspace has a live plan, the gateway holds its setup, so the draft is done wherever it is read. */
export const workspaceDraftCompletionListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  const subscriptionsLoaded = billingApi?.endpoints?.billingGetSubscriptionsV1?.matchFulfilled
  // Tests that mock the billing module leave no endpoint to watch.
  if (!subscriptionsLoaded) return

  listenerMiddleware.startListening({
    matcher: subscriptionsLoaded,
    effect: (action, listenerApi) => {
      const { createdSpaceId } = selectStoredWorkspaceDraft(listenerApi.getState())
      if (createdSpaceId === null || action.meta.arg.originalArgs.spaceId !== createdSpaceId) return
      if (isLivePlanStatus(getPlanStatus(selectCurrentSubscription(action.payload)))) {
        listenerApi.dispatch(clearWorkspaceDraft())
      }
    },
  })
}
