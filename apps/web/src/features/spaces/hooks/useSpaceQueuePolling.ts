import { useEffect } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import {
  useSpaceTransactionsGetTransactionQueueV1Query,
  type SpaceQueuedItemPage,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
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

const getTxIdsAwaitingSignature = (
  page: SpaceQueuedItemPage,
  walletAddress: string,
  pendingTxs: PendingTxsState,
): string[] =>
  page.results
    .flatMap((run) => run.items.filter(isTransactionQueuedItem))
    .filter(
      ({ transaction }) =>
        transaction.txStatus === TransactionStatus.AWAITING_CONFIRMATIONS &&
        !pendingTxs[transaction.id] &&
        isSignableBy(transaction, walletAddress),
    )
    .map(({ transaction }) => transaction.id)

/** Polls the first page of the current Space's queue, which spaceQueueReconciliationListener settles pending txs from. */
export const useSpaceQueuePolling = (): void => {
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const isActiveMember = useIsActiveMember(spaceId ?? undefined)
  const isEnabled = useHasFeature(FEATURES.SPACE_TRANSACTIONS)
  const pendingTxs = useAppSelector(selectPendingTxs)
  const walletAddress = useWallet()?.address

  const isActive = !!spaceId && isSignedIn && isActiveMember && !!isEnabled
  const { currentData, refetch } = useSpaceTransactionsGetTransactionQueueV1Query(isActive ? { spaceId } : skipToken, {
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
