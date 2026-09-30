import type { ReactElement, ReactNode } from 'react'
import ChainIndicator from '@/components/common/ChainIndicator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import NetworkLogosList from '../NetworkLogosList'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

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

const NetworkLogosTooltip = ({
  networks,
  maxVisible = 3,
  imageSize,
  contentImageSize,
  trigger,
  triggerRender = <span className="inline-flex origin-left scale-85" />,
  contentTestId,
}: NetworkLogosTooltipProps) => (
  <Tooltip>
    <TooltipTrigger render={triggerRender}>
      {trigger ?? <NetworkLogosList networks={networks} showHasMore maxVisible={maxVisible} imageSize={imageSize} />}
    </TooltipTrigger>
    <TooltipContent className="bg-popover text-popover-foreground ring-foreground/10 shadow-md ring-1 [&>[data-side]]:hidden">
      <div
        data-testid={contentTestId}
        className="no-scrollbar flex flex-col gap-1 overflow-y-auto overscroll-contain"
        style={{ maxHeight: 'calc(var(--available-height) - 0.75rem)' }}
      >
        {networks.map((network) => (
          <ChainIndicator key={network.chainId} chainId={network.chainId} imageSize={contentImageSize} />
        ))}
      </div>
    </TooltipContent>
  </Tooltip>
)

export default NetworkLogosTooltip
