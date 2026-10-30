import { useEffect } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { POLLING_INTERVAL } from '@/config/constants'
import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { selectPendingTxs, type PendingTxsState } from '@/store/pendingTxsSlice'
import { isSignableBy, isTransactionQueuedItem } from '@/utils/transaction-guards'
import { useGetSpaceQueueQuery, type SpaceQueue } from '../store/spaceQueueApi'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useIsActiveMember } from './useSpaceMembers'

const REFETCH_EVENTS = [
  TxEvent.PROPOSED,
  TxEvent.SIGNATURE_PROPOSED,
  TxEvent.PROCESSED,
  TxEvent.SUCCESS,
  TxEvent.DELETED,
]

// Module scope: Space pages each mount their own AuthState, and a page change must not toast again
const notifiedTxIds = new Set<string>()

const getTxIdsAwaitingSignature = (queue: SpaceQueue, walletAddress: string, pendingTxs: PendingTxsState): string[] =>
  queue.sections
    .flatMap((safe) => safe.chains.flatMap((chain) => chain.items.filter(isTransactionQueuedItem)))
    .filter(
      ({ transaction }) =>
        transaction.txStatus === TransactionStatus.AWAITING_CONFIRMATIONS &&
        !pendingTxs[transaction.id] &&
        isSignableBy(transaction, walletAddress),
    )
    .map(({ transaction }) => transaction.id)

/** Polls the current Space's queue, which spaceQueueReconciliationListener settles pending txs from. */
export const useSpaceQueuePolling = (): void => {
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const isActiveMember = useIsActiveMember(spaceId ?? undefined)
  const isEnabled = useHasFeature(FEATURES.SPACE_TRANSACTIONS)
  const pendingTxs = useAppSelector(selectPendingTxs)
  const walletAddress = useWallet()?.address

  const isActive = !!spaceId && isSignedIn && isActiveMember && !!isEnabled
  // The same arguments as the queue page, so the page and this poll share one request
  const { currentData, refetch } = useGetSpaceQueueQuery(isActive ? { spaceId } : skipToken, {
    pollingInterval: POLLING_INTERVAL,
    skipPollingIfUnfocused: true,
  })

  useEffect(() => {
    if (!isActive) return
    const unsubscribers = REFETCH_EVENTS.map((event) => txSubscribe(event, () => refetch()))
    return () => unsubscribers.forEach((unsub) => unsub())
  }, [isActive, refetch])

  useEffect(() => {
    if (!isActive || !currentData || !walletAddress) return

    const newKeys = getTxIdsAwaitingSignature(currentData, walletAddress, pendingTxs)
      .map((txId) => `${walletAddress}:${txId}`)
      .filter((key) => !notifiedTxIds.has(key))
    if (newKeys.length === 0) return
    newKeys.forEach((key) => notifiedTxIds.add(key))

    dispatch(
      showNotification({
        variant: 'info',
        message:
          newKeys.length === 1
            ? 'A transaction requires your confirmation.'
            : `${newKeys.length} transactions require your confirmation.`,
        groupKey: `space-queue-confirmation-${spaceId}`,
        link: {
          href: { pathname: AppRoutes.spaces.transactions, query: { spaceId } },
          title: 'View transactions',
        },
      }),
    )
  }, [isActive, currentData, walletAddress, pendingTxs, spaceId, dispatch])
}
