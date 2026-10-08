import type { ReactElement, ReactNode } from 'react'
import ChainIndicator from '@/components/common/ChainIndicator'
import NetworkLogosList from '../NetworkLogosList'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { NetworkLogosTooltipView } from '@views/features/multichain/components/NetworkLogosTooltip/NetworkLogosTooltipView'

export type NetworkLogosTooltipProps = {
  networks: Pick<Chain, 'chainId'>[]
  /** Max logos to show before the "+N" indicator */
  maxVisible?: number
  /** Logo size in the trigger's NetworkLogosList */
  imageSize?: number
  /** Logo size for the ChainIndicator list inside the tooltip */
  contentImageSize?: number
  /** Replaces the default NetworkLogosList trigger (e.g. an "All" badge) */
  trigger?: ReactNode
  /** Element passed to TooltipTrigger's `render` prop; defaults to a scaled span */
  triggerRender?: ReactElement
  contentTestId?: string
}

const NetworkLogosTooltip = (props: NetworkLogosTooltipProps) => (
  <NetworkLogosTooltipView
    {...props}
    renderChainIndicator={(indicatorProps) => <ChainIndicator {...indicatorProps} />}
    renderNetworkLogosList={(listProps) => <NetworkLogosList {...listProps} />}
  />
)

export default NetworkLogosTooltip
