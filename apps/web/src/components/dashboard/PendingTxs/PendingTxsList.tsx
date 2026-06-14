import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React, { type ReactElement } from 'react'
import { useMemo } from 'react'
import { useSafeQueryParam } from '@/hooks/useSafeAddressFromUrl'
import dynamic from 'next/dynamic'
import { getLatestTransactions } from '@/utils/tx-list'
import { Typography } from '@/components/ui/typography'
import { Skeleton } from '@/components/ui/skeleton'
import { ViewAllLink } from '../styled'
import PendingTxListItem from './PendingTxListItem'
import useTxQueue, { useQueuedTxsLength } from '@/hooks/useTxQueue'
import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'
import { isSignableBy, isExecutable } from '@/utils/transaction-guards'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useRecoveryQueue } from '@/features/recovery'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { RecoveryQueueItem } from '@/features/recovery'
import { SidebarListItemCounter } from '@/components/sidebar/SidebarList'

const PendingRecoveryListItem = dynamic(() => import('./PendingRecoveryListItem'))

const MAX_TXS = 4

const PendingTxsSkeleton = () => (
  <section className="h-full overflow-hidden rounded-xl bg-[var(--color-background-paper)] px-3 py-5">
    <div className="mb-2 flex flex-row px-3">
      <Typography variant="paragraph-bold">Pending transactions</Typography>
    </div>

    <Skeleton className="h-[66px] w-full rounded-lg" />
  </section>
)

const EmptyState = () => {
  return (
    <div data-testid="no-tx-text" className="rounded-xl bg-[var(--color-background-paper)] p-10 text-center">
      <Typography className="mb-1 mt-6">No transactions to sign</Typography>
    </div>
  )
}

function getActionableTransactions(
  txs: TransactionQueuedItem[],
  safe: SafeState,
  walletAddress?: string,
): TransactionQueuedItem[] {
  if (!walletAddress) {
    return txs
  }

  return txs.filter((tx) => {
    return isSignableBy(tx.transaction, walletAddress) || isExecutable(tx.transaction, walletAddress, safe)
  })
}

export function _getTransactionsToDisplay({
  recoveryQueue,
  queue,
  walletAddress,
  safe,
}: {
  recoveryQueue: RecoveryQueueItem[]
  queue: TransactionQueuedItem[]
  walletAddress?: string
  safe: SafeState
}): [RecoveryQueueItem[], TransactionQueuedItem[]] {
  if (recoveryQueue.length >= MAX_TXS) {
    return [recoveryQueue.slice(0, MAX_TXS), []]
  }

  const actionableQueue = getActionableTransactions(queue, safe, walletAddress)
  const _queue = actionableQueue.length > 0 ? actionableQueue : queue
  const queueToDisplay = _queue.slice(0, MAX_TXS - recoveryQueue.length)

  return [recoveryQueue, queueToDisplay]
}

const PendingTxsList = (): ReactElement | null => {
  const { page, loading } = useTxQueue()
  const { safe, safeLoaded, safeLoading } = useSafeInfo()
  const wallet = useWallet()
  const queuedTxns = useMemo(() => getLatestTransactions(page?.results), [page?.results])

  const recoveryQueue = useRecoveryQueue()
  const queueSize = useQueuedTxsLength()

  const [recoveryTxs, queuedTxs] = useMemo(() => {
    return _getTransactionsToDisplay({
      recoveryQueue,
      queue: queuedTxns,
      walletAddress: wallet?.address,
      safe,
    })
  }, [recoveryQueue, queuedTxns, wallet?.address, safe])

  const totalTxs = recoveryTxs.length + queuedTxs.length

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = loading || safeLoading || isInitialState

  const safeQueryParam = useSafeQueryParam()

  const queueUrl = useMemo(
    () => ({
      pathname: AppRoutes.transactions.queue,
      query: { safe: safeQueryParam },
    }),
    [safeQueryParam],
  )

  if (isLoading) return <PendingTxsSkeleton />

  return (
    <section
      data-testid="pending-tx-widget"
      className="h-full w-full overflow-hidden rounded-xl bg-[var(--color-background-paper)] px-6 pb-3 pt-5 lg:px-3"
    >
      <div className="mb-2 flex flex-row justify-between px-3">
        <Typography variant="paragraph-bold" className={css.pendingTxHeader}>
          Pending transactions <SidebarListItemCounter count={queueSize} />
        </Typography>
        {totalTxs > 0 && <ViewAllLink url={queueUrl} />}
      </div>

      <div>
        {totalTxs > 0 ? (
          <div className={css.list}>
            {recoveryTxs.map((tx) => (
              <PendingRecoveryListItem transaction={tx} key={tx.transactionHash} />
            ))}

            {queuedTxs.map((tx) => (
              <PendingTxListItem transaction={tx.transaction} key={tx.transaction.id} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  )
}

export default PendingTxsList
