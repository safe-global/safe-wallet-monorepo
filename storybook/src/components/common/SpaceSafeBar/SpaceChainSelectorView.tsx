import type { ReactElement, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function SpaceChainSelectorSkeleton(): ReactElement {
  return (
    <div className="self-stretch min-h-10 order-last flex items-center rounded-lg bg-muted px-4">
      <Skeleton className="size-6 rounded-full" />
    </div>
  )
}

export type SpaceChainSelectorViewProps = {
  isDisabled: boolean
  /** Renders the ChainSelectorBlock container */
  renderChainSelector: (props: { disabled?: boolean }) => ReactNode
  addNetworkDialog: ReactNode
}

export function SpaceChainSelectorView({
  isDisabled,
  renderChainSelector,
  addNetworkDialog,
}: SpaceChainSelectorViewProps): ReactElement {
  return (
    // min-h-10 matches the safe selector's own `h-10` — see SpaceNestedSafesButton.
    <div
      className="self-stretch min-h-10 order-last flex items-stretch rounded-lg bg-muted"
      data-testid="space-chain-selector"
    >
      {isDisabled ? (
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            {renderChainSelector({ disabled: true })}
          </TooltipTrigger>
          <TooltipContent>Changing the network is not allowed in this screen</TooltipContent>
        </Tooltip>
      ) : (
        renderChainSelector({})
      )}

      {addNetworkDialog}
    </div>
  )
}
