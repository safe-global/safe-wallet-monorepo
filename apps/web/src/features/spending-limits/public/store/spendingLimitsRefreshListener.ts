import type { listenerMiddlewareInstance, RootState } from '@/store'
import { safeInfoSlice, selectSafeInfo } from '@/store/safeInfoSlice'
import { gatewayApi } from '@/store/api/gateway'
import { makeSpendingLimitsTag } from '@/store/api/gateway/tagTypes'

const selectSafeHistoryVersion = (state: RootState) => {
  const safe = selectSafeInfo(state).data
  return safe && { chainId: safe.chainId, safeAddress: safe.address.value, txHistoryTag: safe.txHistoryTag }
}

// An invalidation, not a txHistoryTag in the key: a refetch keeps the old limits, a new key empties them
export const spendingLimitsRefreshListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    predicate: (action, currentState, originalState) => {
      if (!safeInfoSlice.actions.set.match(action)) return false
      const current = selectSafeHistoryVersion(currentState)
      const previous = selectSafeHistoryVersion(originalState)
      return (
        !!current?.txHistoryTag &&
        !!previous?.txHistoryTag &&
        current.chainId === previous.chainId &&
        current.safeAddress === previous.safeAddress &&
        current.txHistoryTag !== previous.txHistoryTag
      )
    },
    effect: (_action, listenerApi) => {
      const safe = selectSafeHistoryVersion(listenerApi.getState())
      if (!safe) return
      const id = makeSpendingLimitsTag(safe.chainId, safe.safeAddress)
      listenerApi.dispatch(gatewayApi.util.invalidateTags([{ type: 'SpendingLimits', id }]))
    },
  })
}
