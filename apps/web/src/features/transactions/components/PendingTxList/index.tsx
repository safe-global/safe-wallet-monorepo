import { type ReactElement, useMemo } from 'react'
import { useRouter } from 'next/router'
import { ChevronRight } from 'lucide-react'
import { getLatestTransactions } from '@/utils/tx-list'
import useTxQueue, { useQueuedTxsLength } from '@/hooks/useTxQueue'
import useSafeInfo from '@/hooks/useSafeInfo'
import { AppRoutes } from '@/config/routes'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTxStatus, formatTxDate, _getTransactionsToDisplay } from '../../utils'
import type { RecoveryQueueItem } from '@/features/recovery'
import { useRecoveryQueue } from '@/features/recovery'
import useWallet from '@/hooks/wallets/useWallet'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import TxInfo from '@/components/transactions/TxInfo'
import PendingRecoveryListItem from '@/components/dashboard/PendingTxs/PendingRecoveryListItem'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const MAX_TXS = 3

interface TxIconProps {
  tx: TransactionQueuedItem
}

const TxIcon = ({ tx }: TxIconProps): ReactElement => (
  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f0fdf4]">
    <TxTypeIcon tx={tx.transaction} />
  </div>
)

const PendingTxList = (): ReactElement => {
  const { page, loading } = useTxQueue()
  const router = useRouter()
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

  const isInitialState = !safeLoaded && !safeLoading
  const isLoading = loading || safeLoading || isInitialState

  const handleViewAll = () => {
    router.push({ pathname: AppRoutes.transactions.queue, query: { safe: router.query.safe } })
  }

  const handleNavigate = () => {
    router.push({ pathname: AppRoutes.transactions.queue, query: { safe: router.query.safe } })
  }

  return (
    <SafeWidget
      title="Pending"
      action={
        <Button variant="ghost" size="icon-sm" onClick={handleNavigate}>
          <ChevronRight className="size-6" />
        </Button>
      }
    >
      {isLoading ? (
        Array.from({ length: MAX_TXS }).map((_, i) => <SafeWidget.ItemSkeleton key={i} />)
      ) : queuedTxs.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">No pending transactions</p>
      ) : (
        <>
          {recoveryTxs.map((tx: RecoveryQueueItem) => (
            <PendingRecoveryListItem transaction={tx} key={tx.transactionHash} />
          ))}

          {queuedTxs.map((tx: TransactionQueuedItem) => {
            return (
              <SafeWidget.Item
                key={tx.transaction.id}
                href={`${AppRoutes.transactions.tx}?id=${tx.transaction.id}&safe=${router.query.safe}`}
                label={
                  <div className="flex gap-1 items-center">
                    <TxTypeText tx={tx.transaction} /> <TxInfo info={tx.transaction.txInfo} />
                  </div>
                }
                info={formatTxDate(tx.transaction.timestamp)}
                startNode={<TxIcon tx={tx} />}
                actionNode={<Badge variant="secondary">{getTxStatus(tx)}</Badge>}
              />
            )
          })}
        </>
      )}
      {!isLoading && queuedTxs.length > 0 && (
        <SafeWidget.Footer count={parseInt(queueSize)} text="View all pending transactions" onClick={handleViewAll} />
      )}
    </SafeWidget>
  )
}

export default PendingTxList
