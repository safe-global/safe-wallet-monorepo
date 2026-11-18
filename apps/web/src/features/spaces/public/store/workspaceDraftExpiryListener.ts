import type { listenerMiddlewareInstance } from '@/store/index'
import { HYDRATE_ACTION } from '@/store/hydrateAction'
import { clearWorkspaceDraft, isExpiredDraft, selectStoredWorkspaceDraft } from './workspaceDraftSlice'

/** An expired draft is cleared as the stored state loads, so its addresses and emails leave localStorage too. */
export const workspaceDraftExpiryListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    type: HYDRATE_ACTION,
    effect: (_, listenerApi) => {
      if (isExpiredDraft(selectStoredWorkspaceDraft(listenerApi.getState()), Date.now())) {
        listenerApi.dispatch(clearWorkspaceDraft())
      }
    },
  })
}
