import React, { type ReactElement } from 'react'
import { useMemo } from 'react'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'
import { getLatestTransactions } from '@/utils/tx-list'
import { Box, Typography, Card, Stack, Paper, Skeleton } from '@mui/material'
import { ViewAllLink } from '../styled'
import PendingTxListItem from './PendingTxListItem'
import useTxQueue, { useQueuedTxsLength } from '@/hooks/useTxQueue'
import { AppRoutes } from '@/config/routes'
import css from './styles.module.css'
import { isSignableBy, isExecutable } from '@/utils/transaction-guards'
import useWallet from '@/hooks/wallets/useWallet'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useRecoveryQueue } from '@/features/recovery/hooks/useRecoveryQueue'
import type { Transaction } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import NoTxsIcon from '@/public/images/common/no-txs.svg'
import { SidebarListItemCounter } from '@/components/sidebar/SidebarList'

const PendingRecoveryListItem = dynamic(() => import('./PendingRecoveryListItem'))

const MAX_TXS = 4

const EmptyState = () => {
  return (
    <Paper elevation={0} sx={{ p: 5, textAlign: 'center' }}>
      <NoTxsIcon data-testid="no-tx-icon" />

      <Typography mb={0.5} mt={3}>
        No transactions to sign
      </Typography>

      <Typography data-testid="no-tx-text" variant="body1" color="primary.light">
        Once you create pending transactions, they will appear here
      </Typography>
    </Paper>
  )
}

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

  const queueUrl = useMemo(
    () => ({
      pathname: AppRoutes.transactions.queue,
      query: { safe: router.query.safe },
    }),
    [router.query.safe],
  )

  if (loading) return <Skeleton variant="rounded" height={338} />

  return (
    <Card data-testid="pending-tx-widget" sx={{ px: 1.5, py: 2.5, height: 1 }} component="section">
      <Stack direction="row" justifyContent="space-between" sx={{ px: 1.5, mb: 1 }}>
        <Typography fontWeight={700} className={css.pendingTxHeader}>
          Pending transactions <SidebarListItemCounter count={queueSize} />
        </Typography>
        {totalTxs > 0 && <ViewAllLink url={queueUrl} />}
      </Stack>

      <Box>
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
      </Box>
    </Card>
  )
}

export default PendingTxsList
