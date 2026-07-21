import type { ReactElement } from 'react'
import { Users } from 'lucide-react'
import SafeWidget from '../SafeWidget'
import { Badge } from '@/components/ui/badge'
import { getTxStatus } from '@/features/transactions/utils'
import { formatTimeInWords } from '@safe-global/utils/utils/date'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import TxInfo from '@/components/transactions/TxInfo'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import Identicon from '@/components/common/Identicon'
import { AppRoutes } from '@/config/routes'
import { getEip3770ShortName } from '@safe-global/utils/utils/chains'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

/** Transaction with safeAddress and chainId from the space pending-transactions API */
type SpacePendingTxItem = TransactionQueuedItem & { safeAddress?: string; chainId?: string }

interface PendingTxWidgetProps {
  transactions: SpacePendingTxItem[]
  loading?: boolean
  error?: string
  onRefresh?: () => void
  onItemClick?: (safeAddress: string, txId: string) => void
}

const SKELETON_COUNT = 4

const TxIcon = ({ tx }: { tx: SpacePendingTxItem }): ReactElement => (
  <div className={cn(css.iconBG, 'flex shrink-0 items-center justify-center', '!mb-0')}>
    <TxTypeIcon tx={tx.transaction} />
  </div>
)

const PendingTxWidget = ({
  transactions,
  loading = false,
  error,
  onRefresh,
  onItemClick,
}: PendingTxWidgetProps): ReactElement => {
  const isEmpty = transactions.length === 0 && !loading
  const hasError = !!error && !loading

  if (hasError) {
    return (
      <SafeWidget title="Pending" testId="space-dashboard-pending-widget">
        <SafeWidget.ErrorState message="Unable to load content" onRefresh={onRefresh} />
      </SafeWidget>
    )
  }

  if (isEmpty) {
    return (
      <SafeWidget title="Pending" testId="space-dashboard-pending-widget">
        <SafeWidget.EmptyState icon={<Users className="size-6 text-green-500" />} text="No pending transactions" />
      </SafeWidget>
    )
  }

  return (
    <SafeWidget title="Pending" testId="space-dashboard-pending-widget">
      {loading ? (
        Array.from({ length: SKELETON_COUNT }).map((_, i) => <SafeWidget.ItemSkeleton key={i} />)
      ) : transactions.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">No pending transactions</p>
      ) : (
        transactions.map((tx) => {
          const shortName = getEip3770ShortName(tx.chainId ?? '')
          const safeParam = shortName && tx.safeAddress ? `${shortName}:${tx.safeAddress}` : undefined
          const href = safeParam ? `${AppRoutes.transactions.tx}?id=${tx.transaction.id}&safe=${safeParam}` : undefined

          return (
            <SafeWidget.Item
              key={tx.transaction.id}
              href={href}
              onClick={tx.safeAddress ? () => onItemClick?.(tx.safeAddress!, tx.transaction.id) : undefined}
              className={css.widgetItem}
              fixedActionWidth
              label={
                <div className={css.widgetItemLabel}>
                  <TxTypeText tx={tx.transaction} /> <TxInfo info={tx.transaction.txInfo} />
                </div>
              }
              info={formatTimeInWords(tx.transaction.timestamp)}
              startNode={<TxIcon tx={tx} />}
              featuredNode={tx.safeAddress ? <Identicon address={tx.safeAddress} size={24} /> : undefined}
              actionNode={
                <div className="flex justify-end">
                  <Badge variant="secondary">{getTxStatus(tx)}</Badge>
                </div>
              }
            />
          )
        })
      )}
    </SafeWidget>
  )
}

export { PendingTxWidget }
export type { PendingTxWidgetProps }
export default PendingTxWidget
