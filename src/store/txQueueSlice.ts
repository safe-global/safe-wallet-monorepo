import { createSelector, Middleware } from '@reduxjs/toolkit'
import { TransactionListPage } from '@gnosis.pm/safe-react-gateway-sdk'
import type { RootState } from '@/store'
import { makeLoadableSlice } from './common'
import { isMultisigExecutionInfo, isTransactionListItem } from '@/utils/transaction-guards'
import { trackEvent, TX_LIST_EVENTS } from '@/services/analytics'

const { slice, selector } = makeLoadableSlice('txQueue', undefined as TransactionListPage | undefined)

export const txQueueSlice = slice
export const selectTxQueue = selector

export const selectQueuedTransactions = createSelector(selectTxQueue, (txQueue) => {
  return txQueue.data?.results.filter(isTransactionListItem) || []
})

export const selectQueuedTransactionsByNonce = createSelector(
  selectQueuedTransactions,
  (_: RootState, nonce?: number) => nonce,
  (queuedTransactions, nonce?: number) => {
    return queuedTransactions.filter((item) => {
      return isMultisigExecutionInfo(item.transaction.executionInfo) && item.transaction.executionInfo.nonce === nonce
    })
  },
)

export const txQueueMiddleware: Middleware<{}, RootState> = () => (next) => (action) => {
  const result = next(action)

  switch (action.type) {
    case txQueueSlice.actions.set.type: {
      const { payload } = action as ReturnType<typeof txQueueSlice.actions.set>

      if (!payload.data) return

      trackEvent({
        ...TX_LIST_EVENTS.QUEUED_TXS,
        label: payload.data.results.length.toString(),
      })
    }
  }

  return result
}
