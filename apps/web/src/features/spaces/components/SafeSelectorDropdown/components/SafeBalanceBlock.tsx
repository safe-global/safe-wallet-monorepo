import FiatValue from '@/components/common/FiatValue'
import { Skeleton } from '@/components/ui/skeleton'

export interface SafeBalanceBlockProps {
  isLoading: boolean
  balance: string
}

function SafeBalanceBlock({ isLoading, balance }: SafeBalanceBlockProps) {
  return (
    <div className="flex flex-col items-end gap-1 py-2 min-w-0 shrink sm:min-w-[90px] sm:shrink-0">
      {isLoading ? (
        <Skeleton className="h-4 w-16 rounded-full" />
      ) : (
        <span data-testid="safe-selector-balance" className="text-sm font-medium text-foreground">
          <FiatValue value={balance} />
        </span>
      )}
    </div>
  )
}

export default SafeBalanceBlock
