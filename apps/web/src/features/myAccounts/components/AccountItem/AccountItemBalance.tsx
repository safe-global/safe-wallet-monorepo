import { Skeleton } from '@mui/material'
import FiatValue from '@/components/common/FiatValue'
import { Typography } from '@/components/ui/typography'
import css from '../AccountItems/styles.module.css'

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
    <div className={css.accountItemBalance} data-testid={testId}>
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
