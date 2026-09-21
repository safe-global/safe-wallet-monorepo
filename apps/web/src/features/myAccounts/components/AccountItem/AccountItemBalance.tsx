import { Skeleton } from '@/components/ui/skeleton'
import FiatValue from '@/components/common/FiatValue'
import { Typography } from '@/components/ui/typography'
import css from '../AccountItems/styles.module.css'
import { cn } from '@/utils/cn'

export interface AccountItemBalanceProps {
  fiatTotal?: string | number
  isLoading?: boolean
  hideBalance?: boolean
  'data-testid'?: string
  className?: string
}

function AccountItemBalance({
  fiatTotal,
  isLoading,
  hideBalance,
  className,
  'data-testid': testId,
}: AccountItemBalanceProps) {
  if (hideBalance) {
    return null
  }

  return (
    <div className={cn(css.accountItemBalance, className)} data-testid={testId}>
      {fiatTotal !== undefined ? (
        <Typography variant="paragraph-small-bold">
          <FiatValue value={fiatTotal} />
        </Typography>
      ) : isLoading ? (
        <Skeleton className="h-4 w-[60px]" />
      ) : null}
    </div>
  )
}

export default AccountItemBalance
