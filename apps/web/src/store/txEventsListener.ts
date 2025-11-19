import type { listenerMiddlewareInstance } from '@/store'
import { cgwApi as transactionsApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { cgwApi as messagesApi } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { cgwApi as ownersApi } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import {
  isTransactionListItem,
  isTransactionQueuedItem,
  isMultisigExecutionInfo,
  isCustomTxInfo,
} from '@/utils/transaction-guards'
import { isSafeMessageListItem } from '@/utils/safe-message-guards'
import { selectPendingTxs, clearPendingTx, PendingStatus } from '@/store/pendingTxsSlice'
import { selectPendingSafeMessages } from '@/store/pendingSafeMessagesSlice'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { safeMsgDispatch, SafeMsgEvent } from '@/services/safe-messages/safeMsgEvents'
import { sameAddress } from '@safe-global/utils/utils/addresses'

const SIGNING_STATES: PendingStatus[] = [PendingStatus.SIGNING, PendingStatus.SUBMITTING]

/**
 * Listen for changes in the tx history from RTK Query and handle pending transaction updates
 * This replaces the old txHistoryListener that watched Redux slice updates
 */
export const txHistoryListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  // Check if endpoint exists before setting up listener (may not exist in test environment)
  if (!transactionsApi.endpoints?.transactionsGetTransactionsHistoryV1?.matchFulfilled) {
    return
  }

  listenerMiddleware.startListening({
    matcher: transactionsApi.endpoints.transactionsGetTransactionsHistoryV1.matchFulfilled,
    effect: (action, listenerApi) => {
      if (!action.payload) {
        return
      }

      const pendingTxs = selectPendingTxs(listenerApi.getState())

      for (const result of action.payload.results) {
        if (!isTransactionListItem(result)) {
          continue
        }

        const pendingTxByNonce = Object.entries(pendingTxs).find(([, pendingTx]) =>
          isMultisigExecutionInfo(result.transaction.executionInfo)
            ? pendingTx.nonce === result.transaction.executionInfo.nonce
            : false,
        )

        if (!pendingTxByNonce) continue

        // Invalidate getOwnedSafe cache as nested Safe was (likely) created
        if (isCustomTxInfo(result.transaction.txInfo)) {
          const method = result.transaction.txInfo.methodName
          const deployedSafe = method === 'createProxyWithNonce'
          const likelyDeployedSafe = method === 'multiSend'

          if (deployedSafe || likelyDeployedSafe) {
            const { chainId, safeAddress } = action.meta.arg.originalArgs

            if (chainId && safeAddress) {
              listenerApi.dispatch(
                ownersApi.util.invalidateTags([
                  {
                    type: 'owners',
                  },
                ]),
              )
            }
          }
        }

        const txId = result.transaction.id

        const [pendingTxId, pendingTx] = pendingTxByNonce

        if (pendingTxId === txId) {
          const txHash = 'txHash' in pendingTx ? pendingTx.txHash : undefined
          txDispatch(TxEvent.SUCCESS, {
            nonce: pendingTx.nonce,
            txId,
            groupKey: pendingTxs[txId].groupKey,
            txHash,
          })
        } else {
          // There is a pending tx with the same nonce as a history tx but their txIds don't match
          listenerApi.dispatch(clearPendingTx({ txId: pendingTxId }))
        }
      }
    },
  })
}

/**
 * Listen for changes in the tx queue from RTK Query and handle signature indexing
 * This replaces the old txQueueListener that watched Redux slice updates
 */
export const txQueueListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  // Check if endpoint exists before setting up listener (may not exist in test environment)
  if (!transactionsApi.endpoints?.transactionsGetTransactionQueueV1?.matchFulfilled) {
    return
  }

  listenerMiddleware.startListening({
    matcher: transactionsApi.endpoints.transactionsGetTransactionQueueV1.matchFulfilled,
    effect: (action, listenerApi) => {
      if (!action.payload) {
        return
      }

      const pendingTxs = selectPendingTxs(listenerApi.getState())

      for (const result of action.payload.results) {
        if (!isTransactionQueuedItem(result)) {
          continue
        }

        const txId = result.transaction.id

        const pendingTx = pendingTxs[txId]
        if (!pendingTx || !SIGNING_STATES.includes(pendingTx.status) || !('signerAddress' in pendingTx)) {
          continue
        }

        // The transaction is waiting for a signature of awaitingSigner
        if (
          isMultisigExecutionInfo(result.transaction.executionInfo) &&
          !result.transaction.executionInfo.missingSigners?.some((address) =>
            sameAddress(address.value, pendingTx.signerAddress),
          )
        ) {
          txDispatch(TxEvent.SIGNATURE_INDEXED, { txId })
        }
      }
    },
  })
}

/**
 * Listen for changes in safe messages from RTK Query and dispatch update events
 * This replaces the old safeMessagesListener that watched Redux slice updates
 */
export const safeMessagesListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  // Check if endpoint exists before setting up listener (may not exist in test environment)
  if (!messagesApi.endpoints?.messagesGetMessagesBySafeV1?.matchFulfilled) {
    return
  }

  listenerMiddleware.startListening({
    matcher: messagesApi.endpoints.messagesGetMessagesBySafeV1.matchFulfilled,
    effect: (action, listenerApi) => {
      if (!action.payload) {
        return
      }

      const pendingMsgs = selectPendingSafeMessages(listenerApi.getState())

      for (const result of action.payload.results) {
        if (!isSafeMessageListItem(result)) {
          continue
        }

        const { messageHash } = result
        if (pendingMsgs[messageHash]) {
          safeMsgDispatch(SafeMsgEvent.UPDATED, { messageHash })
        }
      }
    },
  })
}
