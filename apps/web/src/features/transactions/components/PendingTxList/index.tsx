import { type ReactElement, useMemo } from 'react'
import { useRouter } from 'next/router'
import { getLatestTransactions } from '@/utils/tx-list'
import useTxQueue, { useQueuedTxsLength } from '@/hooks/useTxQueue'
import useSafeInfo from '@/hooks/useSafeInfo'
import { AppRoutes } from '@/config/routes'
import { SafeWidget } from '@/features/spaces'
import { getTxStatus, formatTxDate, _getTransactionsToDisplay } from '../../utils'
import type { RecoveryQueueItem } from '@/features/recovery'
import { useRecoveryQueue } from '@/features/recovery'
import useWallet from '@/hooks/wallets/useWallet'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import TxInfo from '@/components/transactions/TxInfo'
import PendingRecoveryListItem from '@/components/dashboard/PendingTxs/PendingRecoveryListItem'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { withSpaceIdInUrl } from '@/hooks/useUrlSpaceId'
import { PendingTxListView, TxIconView } from '@views/features/transactions/components/PendingTxList/PendingTxListView'

interface TxIconProps {
  tx: TransactionQueuedItem
}

export const TxIcon = ({ tx }: TxIconProps): ReactElement => <TxIconView icon={<TxTypeIcon tx={tx.transaction} />} />

const PendingTxList = (): ReactElement => {
  const { page, loading } = useTxQueue()
  const router = useRouter()
  const safeLinkQuery = useSafeLinkQuery()
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
    router.push({ pathname: AppRoutes.transactions.queue, query: safeLinkQuery })
  }

  const handleNavigate = () => {
    router.push({ pathname: AppRoutes.transactions.queue, query: safeLinkQuery })
  }

  return (
    <PendingTxListView
      isLoading={isLoading}
      recoveryItems={recoveryTxs.map((tx: RecoveryQueueItem) => (
        <PendingRecoveryListItem transaction={tx} key={tx.transactionHash} />
      ))}
      items={queuedTxs.map((tx: TransactionQueuedItem) => ({
        id: tx.transaction.id,
        href: withSpaceIdInUrl(
          `${AppRoutes.transactions.tx}?id=${tx.transaction.id}&safe=${router.query.safe}`,
          safeLinkQuery.spaceId,
        ),
        typeText: <TxTypeText tx={tx.transaction} />,
        txInfo: <TxInfo info={tx.transaction.txInfo} />,
        date: formatTxDate(tx.transaction.timestamp),
        icon: <TxTypeIcon tx={tx.transaction} />,
        status: getTxStatus(tx),
      }))}
      queueSize={parseInt(queueSize)}
      onNavigate={handleNavigate}
      onViewAll={handleViewAll}
      renderItem={(key, slots) => <SafeWidget.Item key={key} {...slots} />}
    />
  )
}

export default PendingTxList
