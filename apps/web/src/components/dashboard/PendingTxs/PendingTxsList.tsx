import type { ReactElement } from 'react'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { getLatestTransactions } from '@/utils/tx-list'
import { Box, Skeleton, Typography } from '@mui/material'
import { Card, ViewAllLink, WidgetBody, WidgetContainer } from '../styled'
import PendingTxListItem from './PendingTxListItem'
import useTxQueue from '@/hooks/useTxQueue'
import { AppRoutes } from '@/config/routes'
import NoTransactionsIcon from '@/public/images/transactions/no-transactions.svg'
import css from './styles.module.css'
import { isSignableBy, isExecutable } from '@/utils/transaction-guards'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useRecoveryQueue } from '@/features/recovery/hooks/useRecoveryQueue'
import type { Transaction } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

const PendingRecoveryListItem = dynamic(() => import('./PendingRecoveryListItem'))

const MAX_TXS = 4

const EmptyState = () => {
  return (
    <Card>
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%" gap={2}>
        <NoTransactionsIcon data-testid="no-tx-icon" />

        <Typography data-testid="no-tx-text" variant="body1" color="primary.light">
          This Safe Account has no queued transactions
        </Typography>
      </Box>
    </Card>
  )
}

const LoadingState = () => (
  <div className={css.list}>
    {Array.from(Array(MAX_TXS).keys()).map((key) => (
      <Skeleton key={key} variant="rectangular" height={52} />
    ))}
  </div>
)

function getActionableTransactions(txs: Transaction[], safe: SafeState, walletAddress?: string): Transaction[] {
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
  queue: Transaction[]
  walletAddress?: string
  safe: SafeState
}): [RecoveryQueueItem[], Transaction[]] {
  if (recoveryQueue.length >= MAX_TXS) {
    return [recoveryQueue.slice(0, MAX_TXS), []]
  }

  const actionableQueue = getActionableTransactions(queue, safe, walletAddress)
  const _queue = actionableQueue.length > 0 ? actionableQueue : queue
  const queueToDisplay = _queue.slice(0, MAX_TXS - recoveryQueue.length)

  return [recoveryQueue, queueToDisplay]
}

const PendingTxsList = (): ReactElement | null => {
  const router = useRouter()
  const { page, loading } = useTxQueue()
  const { safe } = useSafeInfo()
  const wallet = useWallet()
  const queuedTxns = useMemo(() => getLatestTransactions(page?.results), [page?.results])
  const recoveryQueue = useRecoveryQueue()

  const [recoveryTxs, queuedTxs] = useMemo(() => {
    return _getTransactionsToDisplay({
      recoveryQueue,
      queue: queuedTxns,
      walletAddress: wallet?.address,
      safe,
    })
  }, [recoveryQueue, queuedTxns, wallet?.address, safe])

  const totalTxs = recoveryTxs.length + queuedTxs.length

  const queueUrl = useMemo(
    () => ({
      pathname: AppRoutes.transactions.queue,
      query: { safe: router.query.safe },
    }),
    [router.query.safe],
  )

  return (
    <WidgetContainer data-testid="pending-tx-widget">
      <div className={css.title}>
        <Typography component="h2" variant="subtitle1" fontWeight={700} mb={2}>
          Pending transactions
        </Typography>

        {totalTxs > 0 && <ViewAllLink url={queueUrl} />}
      </div>

      <WidgetBody>
        {loading ? (
          <LoadingState />
        ) : totalTxs > 0 ? (
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
      </WidgetBody>
    </WidgetContainer>
  )
}

export default PendingTxsList
