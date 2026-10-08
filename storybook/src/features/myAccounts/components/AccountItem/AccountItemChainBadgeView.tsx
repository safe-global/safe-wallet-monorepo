import type { ReactElement, ReactNode } from 'react'
import type { SafeItem } from '@/hooks/safes'
import { cn } from '@/utils/cn'

/** Logo size inside the badge — matches the 22px logos of the safe-selector dropdown's SafeRowStats. */
const STACKED_LOGO_SIZE = 22

export type AccountItemChainBadgeViewProps = {
  chainId?: string
  safes?: SafeItem[]
  imageSize: number
  badgeClassName?: string
  renderNetworkLogosTooltip: (props: {
    networks: SafeItem[]
    maxVisible: number
    imageSize: number
    contentImageSize: number
    triggerRender: ReactElement
    contentTestId: string
  }) => ReactNode
  renderChainIndicator: (props: {
    chainId: string
    responsive: boolean
    onlyLogo: boolean
    imageSize: number
    className: string
  }) => ReactNode
}

export const AccountItemChainBadgeView = ({
  chainId,
  safes,
  imageSize,
  badgeClassName,
  renderNetworkLogosTooltip,
  renderChainIndicator,
}: AccountItemChainBadgeViewProps) => {
  // Multi-chain mode: render NetworkLogosList with tooltip
  if (safes && safes.length > 0) {
    return (
      <div className={cn('flex shrink-0 justify-end', badgeClassName)}>
        {renderNetworkLogosTooltip({
          networks: safes,
          maxVisible: 3,
          imageSize: STACKED_LOGO_SIZE,
          contentImageSize: imageSize,
          triggerRender: <span tabIndex={0} className="flex items-center" />,
          contentTestId: 'multichain-tooltip',
        })}
      </div>
    )
  }

  // Single chain mode: render ChainIndicator
  if (chainId) {
    return (
      <div className="shrink-0">
        {renderChainIndicator({
          chainId,
          responsive: true,
          onlyLogo: true,
          imageSize: STACKED_LOGO_SIZE,
          className: 'justify-end',
        })}
      </div>
    )
  }

  return null
}
