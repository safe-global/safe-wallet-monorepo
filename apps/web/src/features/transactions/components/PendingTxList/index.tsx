import { type ReactElement, useMemo } from 'react'
import { useRouter } from 'next/router'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { getLatestTransactions } from '@/utils/tx-list'
import useTxQueue from '@/hooks/useTxQueue'
import useSafeInfo from '@/hooks/useSafeInfo'
import { AppRoutes } from '@/config/routes'
import SafeWidget from '@/features/spaces/components/SafeWidget'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getTxStatus, getTxLabel, formatTxDate } from '../../utils'

const MAX_TXS = 3

const TxIcon = (): ReactElement => (
  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#f0fdf4]">
    <ArrowUpRight className="size-5 text-foreground" />
  </div>
)

const PendingTxList = (): ReactElement => {
  const router = useRouter()
  const { page, loading } = useTxQueue()
  const { safeLoaded, safeLoading } = useSafeInfo()

  const queuedTxs = useMemo(() => {
    const all = getLatestTransactions(page?.results)
    return all.slice(0, MAX_TXS)
  }, [page?.results])

  const remainingCount = useMemo(() => {
    const all = getLatestTransactions(page?.results)
    return all.length > MAX_TXS ? all.length - MAX_TXS : undefined
  }, [page?.results])

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
      {isLoading
        ? Array.from({ length: MAX_TXS }).map((_, i) => <SafeWidget.ItemSkeleton key={i} />)
        : queuedTxs.length === 0
          ? <p className="px-4 py-3 text-sm text-muted-foreground">No pending transactions</p>
          : queuedTxs.map((tx) => (
              <SafeWidget.Item
                key={tx.transaction.id}
                href={`${AppRoutes.transactions.tx}?id=${tx.transaction.id}&safe=${router.query.safe}`}
                label={getTxLabel(tx)}
                info={formatTxDate(tx.transaction.timestamp)}
                startNode={<TxIcon />}
                actionNode={<Badge variant="secondary">{getTxStatus(tx)}</Badge>}
              />
            ))}
      {!isLoading && queuedTxs.length > 0 && (
        <SafeWidget.Footer count={remainingCount} text="View all pending transactions" onClick={handleViewAll} />
      )}
    </SafeWidget>
  )
}

export default PendingTxList
