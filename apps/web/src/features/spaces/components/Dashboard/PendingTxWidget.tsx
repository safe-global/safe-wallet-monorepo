import type { ReactElement } from 'react'
import { ChevronRight, Users } from 'lucide-react'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTxStatus } from '@/features/transactions/utils'
import { formatTimeInWords } from '@safe-global/utils/utils/date'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import TxInfo from '@/components/transactions/TxInfo'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import Identicon from '@/components/common/Identicon'
import css from './styles.module.css'

/** Transaction with safeAddress from the space pending-transactions API */
type SpacePendingTxItem = TransactionQueuedItem & { safeAddress?: string }

interface PendingTxWidgetProps {
  transactions: SpacePendingTxItem[]
  loading?: boolean
  remainingCount?: number
  error?: string
  onViewAll?: () => void
  onNavigate?: () => void
  onRefresh?: () => void
}

const SKELETON_COUNT = 3

const TxIcon = ({ tx }: { tx: SpacePendingTxItem }): ReactElement => (
  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f0fdf4]">
    <TxTypeIcon tx={tx.transaction} />
  </div>
)

const ActionButton = ({ onNavigate }: { onNavigate?: () => void }) => (
  <Button variant="ghost" size="icon-sm" onClick={onNavigate}>
    <ChevronRight className="size-6" />
  </Button>
)

const PendingTxWidget = ({
  transactions,
  loading = false,
  error,
  onNavigate,
  onRefresh,
}: PendingTxWidgetProps): ReactElement => {
  const isEmpty = transactions.length === 0 && !loading
  const hasError = !!error && !loading

  if (hasError) {
    return (
      <SafeWidget title="Pending" action={<ActionButton onNavigate={onNavigate} />}>
        <SafeWidget.ErrorState message="Unable to load content" onRefresh={onRefresh} />
      </SafeWidget>
    )
  }

  if (isEmpty) {
    return (
      <SafeWidget title="Pending" action={<ActionButton onNavigate={onNavigate} />}>
        <SafeWidget.EmptyState icon={<Users className="size-6" />} text="No pending transactions" />
      </SafeWidget>
    )
  }

  return (
    <SafeWidget title="Pending" action={<ActionButton onNavigate={onNavigate} />}>
      {loading ? (
        Array.from({ length: SKELETON_COUNT }).map((_, i) => <SafeWidget.ItemSkeleton key={i} />)
      ) : transactions.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">No pending transactions</p>
      ) : (
        transactions.map((tx) => (
          <SafeWidget.Item
            key={tx.transaction.id}
            className={css.widgetItem}
            label={
              <div className={css.widgetItemLabel}>
                <TxTypeText tx={tx.transaction} /> <TxInfo info={tx.transaction.txInfo} />
              </div>
            }
            info={formatTimeInWords(tx.transaction.timestamp)}
            startNode={<TxIcon tx={tx} />}
            featuredNode={tx.safeAddress ? <Identicon address={tx.safeAddress} size={24} /> : undefined}
            actionNode={
              <div className="w-[200px] max-w-full flex justify-end">
                <Badge variant="secondary">{getTxStatus(tx)}</Badge>
              </div>
            }
          />
        ))
      )}
    </SafeWidget>
  )
}

export { PendingTxWidget }
export type { PendingTxWidgetProps }
export default PendingTxWidget
