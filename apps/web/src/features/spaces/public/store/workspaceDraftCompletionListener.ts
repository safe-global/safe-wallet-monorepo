import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { listenerMiddlewareInstance } from '@/store/index'
import { getPlanStatus, isLivePlanStatus, selectCurrentSubscription } from '../../hooks/billing/subscription'
import { clearWorkspaceDraft, selectStoredWorkspaceDraft } from './workspaceDraftSlice'

/**
 * Once the draft's Workspace has a live plan or an applied setup, the gateway holds the setup, so the draft is done
 * wherever either is read.
 */
export const workspaceDraftCompletionListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    matcher: billingApi.endpoints.billingGetSubscriptionsV1.matchFulfilled,
    effect: (action, listenerApi) => {
      const { createdSpaceId } = selectStoredWorkspaceDraft(listenerApi.getState())
      if (createdSpaceId === null || action.meta.arg.originalArgs.spaceId !== createdSpaceId) return
      if (isLivePlanStatus(getPlanStatus(selectCurrentSubscription(action.payload)))) {
        listenerApi.dispatch(clearWorkspaceDraft())
      }
    },
  })

  const spacesLoaded = spacesApi?.endpoints?.spacesGetV1?.matchFulfilled
  // Like the other spaces listeners: many tests mock the whole spaces module and leave no endpoint to watch.
  if (!spacesLoaded) return

  listenerMiddleware.startListening({
    matcher: spacesLoaded,
    effect: (action, listenerApi) => {
      const { createdSpaceId } = selectStoredWorkspaceDraft(listenerApi.getState())
      const created = action.payload.find((space) => space.uuid === createdSpaceId)
      if (created?.setupStatus === 'applied') listenerApi.dispatch(clearWorkspaceDraft())
    },
  })
}
