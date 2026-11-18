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
      // Nothing was actually removed by this dispatch — a prior `removeUndeployedSafe`
      // already cleared the entry. Skip the DELETE call to avoid spamming the backend
      // with calls that 404 (and pollute the pending-delete queue) when multiple
      // dispatchers fire in the same tick after activation (self-heal in
      // useLoadSafeInfo + INDEXED event in usePendingSafeStatuses).
      if (!removed) return

      // Backend DELETE rejects non-creators with 40x, so skip the call for safes the
      // current user didn't create (e.g. ones synced from a space endpoint).
      // Treat undefined as `true` for backwards compatibility with entries
      // persisted before the isCreator flag existed.
      const wasCreator = removed.isCreator !== false
      if (!wasCreator) return

      // The user can deploy a safe before signing in with SIWE (just a wallet
      // connection is enough). In that case we can't reach the backend yet —
      // queue the delete to be replayed once a SIWE session exists, otherwise
      // the next sync would re-add the now-deployed safe as undeployed.
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
