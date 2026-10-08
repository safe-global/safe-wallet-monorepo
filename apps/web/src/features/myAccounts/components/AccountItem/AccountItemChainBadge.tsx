import ChainIndicator from '@/components/common/ChainIndicator'
import { NetworkLogosTooltip } from '@/features/multichain'
import type { SafeItem } from '@/hooks/safes'
import { AccountItemChainBadgeView } from '@views/features/myAccounts/components/AccountItem/AccountItemChainBadgeView'

export interface AccountItemChainBadgeProps {
  /** Single chain mode */
  chainId?: string
  /** Multi-chain mode - renders network logos with tooltip */
  safes?: SafeItem[]
  imageSize?: number
  className?: string
}

function AccountItemChainBadge({ chainId, safes, className, imageSize = 24 }: AccountItemChainBadgeProps) {
  return (
    <AccountItemChainBadgeView
      chainId={chainId}
      safes={safes}
      imageSize={imageSize}
      badgeClassName={className}
      renderNetworkLogosTooltip={(props) => <NetworkLogosTooltip {...props} />}
      renderChainIndicator={(props) => <ChainIndicator {...props} />}
    />
  )
}

export default AccountItemChainBadge
