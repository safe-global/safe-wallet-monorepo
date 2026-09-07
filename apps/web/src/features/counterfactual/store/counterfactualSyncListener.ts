import type { listenerMiddlewareInstance, RootState } from '@/store/index'
import { isAuthenticated } from '@/store/authSlice'
import { Errors, logError } from '@/services/exceptions'
import { removeUndeployedSafe } from './undeployedSafesSlice'
import { enqueuePendingCfDelete } from './pendingCfDeletesSlice'
import { cgwApi as counterfactualSafesApi } from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'

const is404 = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'status' in error && (error as { status?: unknown }).status === 404

export const counterfactualSyncListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  // Sync removeUndeployedSafe to backend
  listenerMiddleware.startListening({
    actionCreator: removeUndeployedSafe,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState() as RootState
      const { chainId, address } = action.payload

      // Look up the entry in the *pre-action* state — by the time this effect
      // runs, the reducer has already removed it from current state.
      const originalState = listenerApi.getOriginalState() as RootState
      const removed = originalState.undeployedSafes?.[chainId]?.[address]
      // Prior `removeUndeployedSafe` already cleared this entry — skip the DELETE to avoid 404 spam
      // (which pollutes the pending-delete queue) when multiple dispatchers fire in the same tick after
      // activation (useLoadSafeInfo self-heal + usePendingSafeStatuses INDEXED event).
      if (!removed) return

      // Backend DELETE rejects non-creators with 40x, so skip safes the user didn't create (e.g. synced
      // from a space endpoint). Undefined counts as creator, for entries persisted before isCreator existed.
      const wasCreator = removed.isCreator !== false
      if (!wasCreator) return

      // A safe can be deployed before SIWE sign-in (wallet connection alone). The backend is
      // unreachable then, so queue the delete for replay once a SIWE session exists — otherwise the
      // next sync re-adds the now-deployed safe as undeployed.
      if (!isAuthenticated(state)) {
        listenerApi.dispatch(enqueuePendingCfDelete({ chainId, address }))
        return
      }

      try {
        await listenerApi
          .dispatch(
            counterfactualSafesApi.endpoints.counterfactualSafesDeleteV1.initiate({
              deleteCounterfactualSafesDto: { safes: [{ chainId, address }] },
            }),
          )
          .unwrap()
      } catch (e) {
        // 404 means the record is already gone server-side — that's our intended
        // end state, no retry needed.
        if (is404(e)) return
        logError(Errors._650, e)
        // Network/5xx during the live DELETE leaves backend stuck on the now-deployed
        // safe. Queue it so the next sync flushes the retry — otherwise the next GET
        // would return it and the merge would re-add a "Not activated" chip.
        listenerApi.dispatch(enqueuePendingCfDelete({ chainId, address }))
      }
    },
  })
}
