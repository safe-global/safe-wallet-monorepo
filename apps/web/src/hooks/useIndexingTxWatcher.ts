import { useEffect, useMemo, useRef } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { POLLING_INTERVAL } from '@/config/constants'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import { useAppDispatch, useAppSelector } from '@/store'
import { clearPendingTx, PendingStatus, selectPendingTxs, type PendingTx } from '@/store/pendingTxsSlice'
import { getTransactionDetails } from '@/utils/tx-details'
import useEffectiveSafeParams from './useEffectiveSafeParams'

type IndexingTx = Extract<PendingTx, { status: PendingStatus.INDEXING }>

/** The history listener only reports the loaded Safe's transactions, so those of any other Safe are polled here. */
export const useIndexingTxWatcher = (): void => {
  const dispatch = useAppDispatch()
  const pendingTxs = useAppSelector(selectPendingTxs)
  const { effectiveAddress, effectiveChainId } = useEffectiveSafeParams()

  const watched = useMemo(
    () =>
      Object.entries(pendingTxs).filter(
        (entry): entry is [string, IndexingTx] =>
          entry[1].status === PendingStatus.INDEXING &&
          !(entry[1].chainId === effectiveChainId && sameAddress(entry[1].safeAddress, effectiveAddress)),
      ),
    [pendingTxs, effectiveAddress, effectiveChainId],
  )
  // Any pending tx update renews `pendingTxs`, so the poll restarts only when the watched set changes.
  const watchedKey = watched.map(([txId]) => txId).join()
  const latestWatched = useRef(watched)

  useEffect(() => {
    latestWatched.current = watched
  }, [watched])

  useEffect(() => {
    if (!watchedKey) return
    let isCurrent = true

    const poll = () =>
      latestWatched.current.forEach(async ([txId, tx]) => {
        // A failed request is retried on the next poll.
        const details = await getTransactionDetails(tx.chainId, txId).catch(() => undefined)
        if (!isCurrent || !details) return

        // The same outcomes the history listener reports: indexed, or its nonce taken by another transaction.
        if (details.txStatus === 'CANCELLED') {
          dispatch(clearPendingTx({ txId }))
        } else if (details.txStatus === 'SUCCESS' || details.txStatus === 'FAILED') {
          txDispatch(TxEvent.SUCCESS, {
            nonce: tx.nonce,
            txId,
            chainId: tx.chainId,
            safeAddress: tx.safeAddress,
            groupKey: tx.groupKey,
            txHash: tx.txHash,
          })
        }
      })

    poll()
    const interval = setInterval(poll, POLLING_INTERVAL)
    return () => {
      isCurrent = false
      clearInterval(interval)
    }
  }, [watchedKey, dispatch])
}
