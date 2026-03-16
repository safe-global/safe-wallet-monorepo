import { Skeleton } from '@mui/material'
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
        <Typography variant="paragraph-small-medium" color="muted">
          <FiatValue value={fiatTotal} />
        </Typography>
      ) : isLoading ? (
        <Skeleton variant="text" width={60} />
      ) : null}
    </div>
  )
}

export default AccountItemBalance
