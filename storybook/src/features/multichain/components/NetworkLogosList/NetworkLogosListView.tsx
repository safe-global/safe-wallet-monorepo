import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/utils/cn'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import css from './styles.module.css'

export type ChainIndicatorRenderProps = {
  chainId: string
  onlyLogo?: boolean
  inline?: boolean
  imageSize?: number
  responsive?: boolean
  showUnknown?: boolean
}

export type RenderChainIndicator = (props: ChainIndicatorRenderProps) => ReactNode

export type NetworkLogosListViewProps = {
  networks: Pick<Chain, 'chainId'>[]
  showHasMore?: boolean
  maxVisible?: number
  imageSize?: number
  renderChainIndicator: RenderChainIndicator
}

export const NetworkLogosListView = ({
  networks,
  showHasMore = false,
  maxVisible = 4,
  imageSize,
  renderChainIndicator,
}: NetworkLogosListViewProps) => {
  const visibleChains = showHasMore ? networks.slice(0, maxVisible) : networks
  // Drives the overlap-cutout mask geometry in the stylesheet; 24px is the ChainIndicator default.
  const maskSizeVar = imageSize ? ({ '--network-logo-size': `${imageSize}px` } as CSSProperties) : undefined

  return (
    <div className={cn(css.networks, showHasMore && css.capped)} style={maskSizeVar}>
      {visibleChains.map((chain) => (
        <Fragment key={chain.chainId}>
          {renderChainIndicator({ chainId: chain.chainId, onlyLogo: true, inline: true, imageSize })}
        </Fragment>
      ))}
      {showHasMore && networks.length > maxVisible && (
        <div className={css.moreChainsIndicator}>+{networks.length - maxVisible}</div>
      )}
    </div>
  )
}
