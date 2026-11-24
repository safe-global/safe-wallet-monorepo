import { useEffect } from 'react'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'
import { useHasFeature } from '@/hooks/useChains'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { selectPendingTxs, type PendingTxsState } from '@/store/pendingTxsSlice'
import { isSignableBy, isTransactionQueuedItem } from '@/utils/transaction-guards'
import { useCurrentSpaceId } from '../public/hooks/useCurrentSpaceId'
import { useIsActiveMember } from '../public/hooks/useSpaceMembers'
import { useSpaceQueue, type SpaceQueue } from './useSpaceQueue'

// Module scope: Space pages each mount their own AuthState, and a page change must not toast again
const notifiedTxIds = new Set<string>()
// The first queue of a Space and wallet is the backlog, which is not news
const seenQueues = new Set<string>()

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
  // The unfiltered queue page asks for the same args, so both share one cache entry and one request per poll
  const { queue } = useSpaceQueue(spaceId ?? '', {}, { skip: !isActive, poll: true })

  useEffect(() => {
    if (!isActive || !queue || !walletAddress) {
      return
    }

    const newKeys = getTxIdsAwaitingSignature(queue, walletAddress, pendingTxs)
      .map((txId) => `${walletAddress}:${txId}`)
      .filter((key) => !notifiedTxIds.has(key))
    newKeys.forEach((key) => notifiedTxIds.add(key))

    const queueKey = `${spaceId}:${walletAddress}`
    if (!seenQueues.has(queueKey)) {
      seenQueues.add(queueKey)
      return
    }
    if (newKeys.length === 0) {
      return
    }

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
  }, [isActive, queue, walletAddress, pendingTxs, spaceId, dispatch])
}
