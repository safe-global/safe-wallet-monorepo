import type { CSSProperties } from 'react'
import ChainIndicator from '@/components/common/ChainIndicator'
import { cn } from '@/utils/cn'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import css from './styles.module.css'

const NetworkLogosList = ({
  networks,
  showHasMore = false,
  maxVisible = 4,
  imageSize,
}: {
  networks: Pick<Chain, 'chainId'>[]
  showHasMore?: boolean
  maxVisible?: number
  imageSize?: number
}) => {
  const visibleChains = showHasMore ? networks.slice(0, maxVisible) : networks
  // Drives the overlap-cutout mask geometry in the stylesheet; 24px is the ChainIndicator default.
  const maskSizeVar = imageSize ? ({ '--network-logo-size': `${imageSize}px` } as CSSProperties) : undefined

  return (
    <div className={cn(css.networks, showHasMore && css.capped)} style={maskSizeVar}>
      {visibleChains.map((chain) => (
        <ChainIndicator key={chain.chainId} chainId={chain.chainId} onlyLogo inline imageSize={imageSize} />
      ))}
      {showHasMore && networks.length > maxVisible && (
        <div className={css.moreChainsIndicator}>+{networks.length - maxVisible}</div>
      )}
    </div>
  )
}

export default NetworkLogosList
