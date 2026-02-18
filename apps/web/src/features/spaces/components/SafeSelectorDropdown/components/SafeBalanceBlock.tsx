import FiatValue from '@/components/common/FiatValue'
import BalanceDisplay from './BalanceDisplay'

export interface SafeBalanceBlockProps {
  isLoading: boolean
  balance: string
  threshold: number
  owners: number
  showBalanceDisplay: boolean
}

function SafeBalanceBlock({ isLoading, balance, threshold, owners, showBalanceDisplay }: SafeBalanceBlockProps) {
  return (
    <div className="flex flex-col items-end gap-2 py-2 min-w-[90px] shrink-0">
      {isLoading ? (
        <span className="text-sm text-muted-foreground">--</span>
      ) : (
        <span className="text-sm text-muted-foreground">
          <FiatValue value={balance} />
        </span>
      )}
      {showBalanceDisplay && <BalanceDisplay balance="" threshold={threshold} owners={owners} showThreshold={true} />}
    </div>
  )
}

export default SafeBalanceBlock
