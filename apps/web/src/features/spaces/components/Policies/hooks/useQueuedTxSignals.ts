import { useEffect, useMemo, useState } from 'react'
import { shallowEqual } from 'react-redux'
import {
  cgwApi as transactionsApi,
  type TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAppSelector, type RootState } from '@/store'
import { PendingStatus, selectPendingTxs } from '@/store/pendingTxsSlice'
import { isMultisigDetailedExecutionInfo, isTransactionQueuedItem } from '@/utils/transaction-guards'
import { selectSpaceQueuePage, toSpaceQueue } from '../../../hooks/useSpaceQueue'
import { getPendingTxId } from '../utils/mapPendingPolicies'
import { PENDING_TX_OUTCOME_BY_STATUS } from '../utils/pendingTxOutcome'
import type { QueuedPolicy } from './useActivatingPolicies'

const EXECUTING = [PendingStatus.PROCESSING, PendingStatus.RELAYING, PendingStatus.INDEXING]

const NO_IDS: ReadonlySet<string> = new Set()

/** What is known about each queued row's transaction beyond the pending policies, keyed by its tx id. */
export type QueuedTxSignals = {
  /** Executed, as this browser's own pending state or CGW's details of the transaction say. */
  executed: ReadonlySet<string>
  /** Executed but reverted, or replaced by another transaction with its nonce. */
  failed: ReadonlySet<string>
  /** Listed by an earlier Space queue and missing from the latest one, which only a lookup can explain. */
  leftQueue: ReadonlySet<string>
  /** The signatures CGW's details of the transaction count, fresher than the pending policies. */
  confirmations: ReadonlyMap<string, number>
}

const selectCachedTx = (state: RootState, row: QueuedPolicy): TransactionDetails | undefined => {
  const select = transactionsApi.endpoints.transactionsGetTransactionByIdV1.select({
    chainId: row.safe.chainId,
    id: getPendingTxId(row),
  })
  // RootState types the shared gateway reducer without the transactions tags; the cache entries are the same.
  return select(state as unknown as Parameters<typeof select>[0]).data
}

type SeenInQueue = { spaceId: string | null; txIds: ReadonlySet<string> }

/**
 * Reads only what other parts of the app already loaded: this browser's pending transactions, any cached details of
 * a queued transaction, and the Space queue that useSpaceQueuePolling polls.
 */
export const useQueuedTxSignals = (rows: QueuedPolicy[], spaceId: string | null): QueuedTxSignals => {
  const pendingTxs = useAppSelector(selectPendingTxs)
  const cachedTxs = useAppSelector((state) => rows.map((row) => selectCachedTx(state, row)), shallowEqual)
  const queuePage = useAppSelector((state) => (spaceId ? selectSpaceQueuePage(state, spaceId) : undefined))

  const queue = useMemo(() => (queuePage ? toSpaceQueue(queuePage) : undefined), [queuePage])
  const queuedTxIds = useMemo(
    () =>
      queue &&
      new Set(
        queue.sections.flatMap((section) =>
          section.chains.flatMap((chain) =>
            chain.items.filter(isTransactionQueuedItem).map((item) => item.transaction.id.toLowerCase()),
          ),
        ),
      ),
    [queue],
  )

  // A transaction proposed after the last poll is missing from the queue too, so only one seen in it can leave it.
  const [seen, setSeen] = useState<SeenInQueue>({ spaceId, txIds: NO_IDS })
  useEffect(() => {
    if (!queuedTxIds) return
    setSeen((current) => {
      const known = current.spaceId === spaceId ? current.txIds : NO_IDS
      if (current.spaceId === spaceId && [...queuedTxIds].every((txId) => known.has(txId))) return current
      return { spaceId, txIds: new Set([...known, ...queuedTxIds]) }
    })
  }, [queuedTxIds, spaceId])

  return useMemo(() => {
    const executing = new Set(
      Object.entries(pendingTxs)
        .filter(([, pendingTx]) => EXECUTING.includes(pendingTx.status))
        .map(([txId]) => txId.toLowerCase()),
    )
    const executed = new Set<string>()
    const failed = new Set<string>()
    const leftQueue = new Set<string>()
    const confirmations = new Map<string, number>()

    rows.forEach((row, index) => {
      const txId = getPendingTxId(row)
      const details = cachedTxs[index]
      const outcome = details && PENDING_TX_OUTCOME_BY_STATUS[details.txStatus]

      if (executing.has(txId.toLowerCase()) || outcome === 'executed') executed.add(txId)
      if (outcome === 'failed' || outcome === 'replaced') failed.add(txId)
      if (details && isMultisigDetailedExecutionInfo(details.detailedExecutionInfo)) {
        confirmations.set(txId, details.detailedExecutionInfo.confirmations.length)
      }

      const isQueueKnown =
        !!queue &&
        queue.isComplete &&
        seen.spaceId === spaceId &&
        !queue.unavailableSafes.some(
          (safe) => safe.chainId === row.safe.chainId && sameAddress(safe.safeAddress, row.safe.address),
        )
      if (isQueueKnown && seen.txIds.has(txId.toLowerCase()) && !queuedTxIds?.has(txId.toLowerCase())) {
        leftQueue.add(txId)
      }
    })

    return { executed, failed, leftQueue, confirmations }
  }, [rows, cachedTxs, pendingTxs, queue, queuedTxIds, seen, spaceId])
}
