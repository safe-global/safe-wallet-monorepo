import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import type { listenerMiddlewareInstance, RootState } from '@/store/index'
import { cgwApi as spacesApi, type SpaceQueueSafe } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as transactionsApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { clearPendingTx, PendingStatus, selectPendingTxs, type PendingTx } from '@/store/pendingTxsSlice'
import { isMultisigExecutionInfo, isTransactionQueuedItem } from '@/utils/transaction-guards'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { spaceQueueApi, type SpaceQueue } from './spaceQueueApi'

const SIGNING_STATES = [PendingStatus.SIGNING, PendingStatus.NESTED_SIGNING]
const POST_EXECUTION_STATES = [
  PendingStatus.PROCESSING,
  PendingStatus.RELAYING,
  PendingStatus.INDEXING,
  PendingStatus.SUBMITTING,
]

type ListenerApi = { getState: () => RootState; dispatch: ThunkDispatch<RootState, unknown, UnknownAction> }

const isSameSafe = (a: SpaceQueueSafe, b: SpaceQueueSafe): boolean =>
  a.chainId === b.chainId && sameAddress(a.safeAddress, b.safeAddress)

const getQueuedTransactions = (queue: SpaceQueue, safe: SpaceQueueSafe): TransactionQueuedItem[] =>
  (queue.sections.find((section) => sameAddress(section.safeAddress, safe.safeAddress))?.chains ?? [])
    .filter((chain) => chain.chainId === safe.chainId)
    .flatMap((chain) => chain.items.filter(isTransactionQueuedItem))

const getNonce = (item: TransactionQueuedItem): number | undefined =>
  isMultisigExecutionInfo(item.transaction.executionInfo) ? item.transaction.executionInfo.nonce : undefined

// RootState types the shared gateway reducer without the spaces tags; the cache entries are the same.
const isSpaceSafe = (state: unknown, spaceId: string, safe: SpaceQueueSafe): boolean => {
  const select = spacesApi.endpoints.spaceSafesGetV1.select({ spaceId })
  const chainSafes = select(state as Parameters<typeof select>[0]).data?.safes[safe.chainId] ?? []
  return chainSafes.some((address) => sameAddress(address, safe.safeAddress))
}

/** True when the queue proves the pending tx's nonce has left its Safe's queue on that chain. */
const hasLeftQueue = (queue: SpaceQueue, pendingTx: PendingTx, txId: string, isListedSafe: boolean): boolean => {
  if (queue.unavailableSafes.some((safe) => isSameSafe(safe, pendingTx))) return false

  const queued = getQueuedTransactions(queue, pendingTx)
  // A Safe missing from a capped queue may still have transactions past the cap
  if (queued.length === 0) return isListedSafe && queue.isComplete
  if (queued.some((item) => item.transaction.id === txId)) return false

  const nonces = queued.map(getNonce).filter((nonce): nonce is number => nonce !== undefined)
  return nonces.length > 0 && Math.min(...nonces) > pendingTx.nonce
}

const reconcileSignatures = (queue: SpaceQueue, getState: () => RootState): void => {
  const chains = queue.sections.flatMap((section) => section.chains)
  for (const chain of chains) {
    for (const item of chain.items.filter(isTransactionQueuedItem)) {
      const txId = item.transaction.id
      const pendingTx = selectPendingTxs(getState())[txId]
      if (!pendingTx || !SIGNING_STATES.includes(pendingTx.status) || !('signerAddress' in pendingTx)) continue

      const { executionInfo } = item.transaction
      if (
        isMultisigExecutionInfo(executionInfo) &&
        !executionInfo.missingSigners?.some((address) => sameAddress(address.value, pendingTx.signerAddress))
      ) {
        txDispatch(TxEvent.SIGNATURE_INDEXED, { txId })
      }
    }
  }
}

const settleExecution = async (
  txId: string,
  pendingTx: PendingTx,
  { getState, dispatch }: ListenerApi,
): Promise<void> => {
  const request = dispatch(
    transactionsApi.endpoints.transactionsGetTransactionByIdV1.initiate(
      { chainId: pendingTx.chainId, id: txId },
      { subscribe: false, forceRefetch: true },
    ),
  )

  let details
  try {
    details = await request.unwrap()
  } catch {
    return
  }

  // Another tab or listener may have settled the entry while the details were loading
  const current = selectPendingTxs(getState())[txId]
  if (!current || !POST_EXECUTION_STATES.includes(current.status)) return

  if (details.txStatus === TransactionStatus.SUCCESS) {
    txDispatch(TxEvent.SUCCESS, {
      txId,
      chainId: current.chainId,
      safeAddress: current.safeAddress,
      nonce: current.nonce,
      groupKey: current.groupKey,
      txHash: details.txHash ?? ('txHash' in current ? current.txHash : undefined),
    })
    return
  }

  if (details.txStatus === TransactionStatus.FAILED || details.txStatus === TransactionStatus.CANCELLED) {
    dispatch(clearPendingTx({ txId }))
  }
}

/**
 * Space pages have no URL Safe, so txQueueListener and txHistoryListener never settle pending txs
 * signed or executed from the Space queue. This settles them from the polled Space queue.
 */
export const spaceQueueReconciliationListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  const matcher = spaceQueueApi?.endpoints?.getSpaceQueue?.matchFulfilled
  // Tests that mock the spaces module leave no endpoint to watch.
  if (!matcher) return

  listenerMiddleware.startListening({
    matcher,
    effect: async (action, { getState, dispatch }) => {
      const { spaceId } = action.meta.arg.originalArgs
      const queue = action.payload
      reconcileSignatures(queue, getState)

      const settled = Object.entries(selectPendingTxs(getState())).filter(
        ([txId, pendingTx]) =>
          POST_EXECUTION_STATES.includes(pendingTx.status) &&
          hasLeftQueue(queue, pendingTx, txId, isSpaceSafe(getState(), spaceId, pendingTx)),
      )

      await Promise.all(settled.map(([txId, pendingTx]) => settleExecution(txId, pendingTx, { getState, dispatch })))
    },
  })
}
