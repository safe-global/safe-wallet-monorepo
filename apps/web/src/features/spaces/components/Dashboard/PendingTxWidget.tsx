import type { ReactElement } from 'react'
import { ChevronRight } from 'lucide-react'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTxStatus, formatTxDate } from '@/features/transactions/utils'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import TxInfo from '@/components/transactions/TxInfo'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import Identicon from '@/components/common/Identicon'
import css from './styles.module.css'

interface PendingTxWidgetProps {
  transactions: TransactionQueuedItem[]
  loading?: boolean
  remainingCount?: number
  onViewAll?: () => void
  onNavigate?: () => void
}

const SKELETON_COUNT = 3

const TxIcon = ({ tx }: { tx: TransactionQueuedItem }): ReactElement => (
  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f0fdf4]">
    <TxTypeIcon tx={tx.transaction} />
  </div>
)

const PendingTxWidget = ({
  transactions,
  loading = false,
  remainingCount,
  onViewAll,
  onNavigate,
}: PendingTxWidgetProps): ReactElement => {
  return (
    <SafeWidget
      title="Pending"
      action={
        <Button variant="ghost" size="icon-sm" onClick={onNavigate}>
          <ChevronRight className="size-6" />
        </Button>
      }
    >
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
              <div className="flex items-center font-semibold gap-1">
                <TxTypeText tx={tx.transaction} /> <TxInfo info={tx.transaction.txInfo} />
              </div>
            }
            info={formatTxDate(tx.transaction.timestamp)}
            startNode={<TxIcon tx={tx} />}
            featuredNode={
              isMultisigExecutionInfo(tx.transaction.executionInfo) &&
                tx.transaction.executionInfo.missingSigners?.[0] ? (
                <Identicon address={tx.transaction.executionInfo.missingSigners[0].value} size={24} />
              ) : undefined
            }
            actionNode={<div className='w-[200px] max-w-full flex justify-end'><Badge variant="secondary">{getTxStatus(tx)}</Badge></div>}
          />
        ))
      )}
    </SafeWidget>
  )
}

export { PendingTxWidget }
export type { PendingTxWidgetProps }
export default PendingTxWidget
