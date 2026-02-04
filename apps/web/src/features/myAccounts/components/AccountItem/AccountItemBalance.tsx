import { Typography, Skeleton } from '@mui/material'
import FiatValue from '@/components/common/FiatValue'
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
    <Typography
      variant="body2"
      className={css.accountItemBalance}
      sx={{ fontWeight: 'bold', pl: 1, minWidth: 80 }}
      data-testid={testId}
    >
      {fiatTotal !== undefined ? (
        <FiatValue value={fiatTotal} />
      ) : isLoading ? (
        <Skeleton variant="text" width={60} />
      ) : null}
    </Typography>
  )
}

export default AccountItemBalance
