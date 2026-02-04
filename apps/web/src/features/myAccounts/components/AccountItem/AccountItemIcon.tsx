import SafeIcon from '@/components/common/SafeIcon'
import css from '../AccountItems/styles.module.css'

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
    <div className={css.accountItemIcon} data-testid={testId}>
      <SafeIcon
        address={address}
        owners={owners && owners > 0 ? owners : undefined}
        threshold={threshold && threshold > 0 ? threshold : undefined}
        isMultiChainItem={isMultiChainItem}
        chainId={chainId}
      />
    </div>
  )
}

export default AccountItemIcon
