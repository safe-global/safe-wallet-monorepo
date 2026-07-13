import ChainIndicator from '@/components/common/ChainIndicator'
import { NetworkLogosTooltip } from '@/features/multichain'
import type { SafeItem } from '@/hooks/safes'
import { cn } from '@/utils/cn'

export interface AccountItemChainBadgeProps {
  /** Single chain mode */
  chainId?: string
  /** Multi-chain mode - renders network logos with tooltip */
  safes?: SafeItem[]
  imageSize?: number
  className?: string
}

function AccountItemChainBadge({ chainId, safes, className, imageSize = 24 }: AccountItemChainBadgeProps) {
  // Multi-chain mode: render NetworkLogosList with tooltip
  if (safes && safes.length > 0) {
    return (
      <div className={cn('flex shrink-0 justify-end', className)}>
        <NetworkLogosTooltip
          networks={safes}
          maxVisible={4}
          contentImageSize={imageSize}
          triggerRender={<span tabIndex={0} className="flex items-center" />}
          contentTestId="multichain-tooltip"
        />
      </div>
    )
  }

  // Single chain mode: render ChainIndicator
  if (chainId) {
    return (
      <div className="shrink-0">
        <ChainIndicator chainId={chainId} responsive onlyLogo className="justify-end" />
      </div>
    )
  }

  return null
}

export default AccountItemChainBadge
