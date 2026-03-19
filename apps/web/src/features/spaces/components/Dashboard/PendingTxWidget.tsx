import type { ReactElement } from 'react'
import { Users } from 'lucide-react'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { Badge } from '@/components/ui/badge'
import { getTxStatus } from '@/features/transactions/utils'
import { formatTimeInWords } from '@safe-global/utils/utils/date'
import { TxTypeIcon, TxTypeText } from '@/components/transactions/TxType'
import TxInfo from '@/components/transactions/TxInfo'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import Identicon from '@/components/common/Identicon'
import { AppRoutes } from '@/config/routes'
import { networks } from '@safe-global/protocol-kit/dist/src/utils/eip-3770/config'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

type Chains = Record<string, string>

const chainIdToShortName = networks.reduce<Chains>((result, { shortName, chainId }) => {
  result[chainId.toString()] = shortName.toString()
  return result
}, {})

/** Transaction with safeAddress and chainId from the space pending-transactions API */
type SpacePendingTxItem = TransactionQueuedItem & { safeAddress?: string; chainId?: string }

interface PendingTxWidgetProps {
  transactions: SpacePendingTxItem[]
  loading?: boolean
  remainingCount?: number
  error?: string
  onViewAll?: () => void
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
      <SafeWidget title="Pending">
        <SafeWidget.ErrorState message="Unable to load content" onRefresh={onRefresh} />
      </SafeWidget>
    )
  }

  if (isEmpty) {
    return (
      <SafeWidget title="Pending">
        <SafeWidget.EmptyState icon={<Users className="size-6" />} text="No pending transactions" />
      </SafeWidget>
    )
  }

  return (
    <SafeWidget title="Pending">
      {loading ? (
        Array.from({ length: SKELETON_COUNT }).map((_, i) => <SafeWidget.ItemSkeleton key={i} />)
      ) : transactions.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">No pending transactions</p>
      ) : (
        transactions.map((tx) => {
          const shortName = tx.chainId ? chainIdToShortName[tx.chainId] : undefined
          const safeParam = shortName && tx.safeAddress ? `${shortName}:${tx.safeAddress}` : undefined
          const href = safeParam ? `${AppRoutes.transactions.tx}?id=${tx.transaction.id}&safe=${safeParam}` : undefined

          return (
            <SafeWidget.Item
              key={tx.transaction.id}
              href={href}
              onClick={tx.safeAddress ? () => onItemClick?.(tx.safeAddress!, tx.transaction.id) : undefined}
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
          )
        })
      )}
    </SafeWidget>
  )
}

export { PendingTxWidget }
export type { PendingTxWidgetProps }
export default PendingTxWidget
