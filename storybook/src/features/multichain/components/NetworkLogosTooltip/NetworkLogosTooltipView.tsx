import { Fragment, type ReactElement, type ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type {
  NetworkLogosListViewProps,
  RenderChainIndicator,
} from '@views/features/multichain/components/NetworkLogosList/NetworkLogosListView'

export type NetworkLogosTooltipViewProps = {
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
  renderChainIndicator: RenderChainIndicator
  renderNetworkLogosList: (props: Omit<NetworkLogosListViewProps, 'renderChainIndicator'>) => ReactNode
}

export const NetworkLogosTooltipView = ({
  networks,
  maxVisible = 3,
  imageSize,
  contentImageSize,
  trigger,
  triggerRender = <span className="inline-flex origin-left scale-85" />,
  contentTestId,
  renderChainIndicator,
  renderNetworkLogosList,
}: NetworkLogosTooltipViewProps) => (
  <Tooltip>
    <TooltipTrigger render={triggerRender}>
      {trigger ?? renderNetworkLogosList({ networks, showHasMore: true, maxVisible, imageSize })}
    </TooltipTrigger>
    <TooltipContent className="bg-popover text-popover-foreground ring-foreground/10 shadow-md ring-1 [&>[data-side]]:hidden">
      <div
        data-testid={contentTestId}
        className="no-scrollbar flex flex-col gap-1 overflow-y-auto overscroll-contain"
        style={{ maxHeight: 'calc(var(--available-height) - 0.75rem)' }}
      >
        {networks.map((network) => (
          <Fragment key={network.chainId}>
            {renderChainIndicator({ chainId: network.chainId, imageSize: contentImageSize })}
          </Fragment>
        ))}
      </div>
    </TooltipContent>
  </Tooltip>
)
