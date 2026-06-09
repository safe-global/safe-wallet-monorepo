import FiatValue from '@/components/common/FiatValue'
import { Skeleton } from '@/components/ui/skeleton'
import BalanceDisplay from './BalanceDisplay'

export interface SafeBalanceBlockProps {
  isLoading: boolean
  balance: string
  threshold: number
  owners: number
  showBalanceDisplay: boolean
}

function SafeBalanceBlock({ isLoading, balance, threshold, owners, showBalanceDisplay }: SafeBalanceBlockProps) {
  // 0/0 means the overview hasn't loaded (a deployed safe is always >= 1/1) — keep the skeleton.
  const thresholdLoading = isLoading || (threshold === 0 && owners === 0)

  return (
    <div className="flex flex-col items-end gap-1 py-2 min-w-0 shrink sm:min-w-[90px] sm:shrink-0">
      {isLoading ? (
        <Skeleton className="h-4 w-16 rounded-full" />
      ) : (
        <span data-testid="safe-selector-balance" className="text-sm text-muted-foreground">
          <FiatValue value={balance} />
        </span>
      )}
      {showBalanceDisplay &&
        (thresholdLoading ? (
          <Skeleton className="h-5 w-12 rounded-full" />
        ) : (
          <BalanceDisplay threshold={threshold} owners={owners} />
        ))}
    </div>
  )
}

export default SafeBalanceBlock
