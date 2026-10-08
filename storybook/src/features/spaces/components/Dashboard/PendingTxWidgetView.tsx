import type { ReactElement } from 'react'
import { Users } from 'lucide-react'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { Badge } from '@/components/ui/badge'
import { formatTimeInWords } from '@safe-global/utils/utils/date'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import TxInfo from '@/components/transactions/TxInfo'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import Identicon from '@/components/common/Identicon'
import { cn } from '@/utils/cn'
import css from '@/features/spaces/components/Dashboard/styles.module.css'

/** Transaction with safeAddress and chainId from the space pending-transactions API */
export type SpacePendingTxItem = TransactionQueuedItem & { safeAddress?: string; chainId?: string }

export type PendingTxWidgetViewItem = {
  tx: SpacePendingTxItem
  href?: string
  onClick?: () => void
  status: string
}

export type PendingTxWidgetViewProps = {
  items: PendingTxWidgetViewItem[]
  loading: boolean
  hasError: boolean
  isEmpty: boolean
  onRefresh?: () => void
}

const SKELETON_COUNT = 4

const TxIcon = ({ tx }: { tx: SpacePendingTxItem }): ReactElement => (
  <div className={cn(css.iconBG, 'flex shrink-0 items-center justify-center', '!mb-0')}>
    <TxTypeIcon tx={tx.transaction} />
  </div>
)

export const PendingTxWidgetView = ({
  items,
  loading,
  hasError,
  isEmpty,
  onRefresh,
}: PendingTxWidgetViewProps): ReactElement => {
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
      ) : items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">No pending transactions</p>
      ) : (
        items.map(({ tx, href, onClick, status }) => (
          <SafeWidget.Item
            key={tx.transaction.id}
            href={href}
            onClick={onClick}
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
                <Badge variant="secondary">{status}</Badge>
              </div>
            }
          />
        ))
      )}
    </SafeWidget>
  )
}
