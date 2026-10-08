import FiatValue from '@/components/common/FiatValue'
import { AccountItemBalanceView } from '@views/features/myAccounts/components/AccountItem/AccountItemBalanceView'

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
    <AccountItemBalanceView
      fiatValue={fiatTotal !== undefined ? <FiatValue value={fiatTotal} /> : undefined}
      isLoading={isLoading}
      balanceClassName={className}
      testId={testId}
    />
  )
}

export default AccountItemBalance
