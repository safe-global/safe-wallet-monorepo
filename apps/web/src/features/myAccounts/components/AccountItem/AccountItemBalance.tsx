import { Typography, Skeleton } from '@mui/material'
import FiatValue from '@/components/common/FiatValue'
import css from '../AccountItems/styles.module.css'

export interface AccountItemBalanceProps {
  fiatTotal?: string | number
  isLoading?: boolean
  hideBalance?: boolean
}

function AccountItemBalance({ fiatTotal, isLoading, hideBalance }: AccountItemBalanceProps) {
  if (hideBalance) {
    return null
  }

  return (
    <Typography variant="body2" className={css.accountItemBalance} sx={{ fontWeight: 'bold', pl: 1, minWidth: 80 }}>
      {fiatTotal !== undefined ? (
        <FiatValue value={fiatTotal} />
      ) : isLoading ? (
        <Skeleton variant="text" width={60} />
      ) : null}
    </Typography>
  )
}

export default AccountItemBalance
