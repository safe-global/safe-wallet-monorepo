import SafeIcon from '@/components/common/SafeIcon'
import { AccountItemIconView } from '@views/features/myAccounts/components/AccountItem/AccountItemIconView'

export interface AccountItemIconProps {
  address: string
  chainId: string
  threshold?: number
  owners?: number
  isMultiChainItem?: boolean
  'data-testid'?: string
}

function AccountItemIcon({
  address,
  chainId,
  threshold,
  owners,
  isMultiChainItem,
  'data-testid': testId,
}: AccountItemIconProps) {
  return (
    <AccountItemIconView
      testId={testId}
      safeIcon={
        <SafeIcon
          address={address}
          owners={owners && owners > 0 ? owners : undefined}
          threshold={threshold && threshold > 0 ? threshold : undefined}
          isMultiChainItem={isMultiChainItem}
          chainId={chainId}
        />
      }
    />
  )
}

export default AccountItemIcon
