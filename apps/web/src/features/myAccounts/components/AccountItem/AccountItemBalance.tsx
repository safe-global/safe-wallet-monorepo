import { Skeleton } from '@mui/material'
import FiatValue from '@/components/common/FiatValue'
import css from '../AccountItems/styles.module.css'
import { cn } from '@/utils/cn'

export interface AccountItemBalanceProps {
  fiatTotal?: string | number
  isLoading?: boolean
  hideBalance?: boolean
  'data-testid'?: string
}

function AccountItemBalance({ fiatTotal, isLoading, hideBalance, 'data-testid': testId }: AccountItemBalanceProps) {
  if (hideBalance) {
    return null
  }

  return (
    <span className={cn(css.accountItemBalance, 'text-sm font-medium text-muted-foreground')} data-testid={testId}>
      {fiatTotal !== undefined ? (
        <FiatValue value={fiatTotal} />
      ) : isLoading ? (
        <Skeleton variant="text" width={60} />
      ) : null}
    </span>
  )
}

export default AccountItemBalance
