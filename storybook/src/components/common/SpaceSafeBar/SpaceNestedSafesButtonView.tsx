import type { MouseEvent, ReactElement, ReactNode } from 'react'
import { GitMerge } from 'lucide-react'

import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/utils/cn'

export type SpaceNestedSafesButtonViewProps = {
  isDisabled: boolean
  displayCount: number
  onClick: (event: MouseEvent<HTMLButtonElement>) => void
  popover: ReactNode
}

export function SpaceNestedSafesButtonView({
  isDisabled,
  displayCount,
  onClick,
  popover,
}: SpaceNestedSafesButtonViewProps): ReactElement {
  return (
    <>
      {/* min-h-10 matches the safe selector's own `h-10`: `self-stretch` only sizes this to the
          selector while they share a flex line, so without a floor the chip collapses to its
          icon height on the narrow layouts where the selector wraps onto its own row. */}
      <div className="flex self-stretch items-stretch min-h-10 order-1 rounded-lg bg-muted">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={isDisabled ? undefined : onClick}
                disabled={isDisabled}
                className={cn(
                  'relative flex items-center border-0 rounded-lg bg-transparent px-3 transition-colors',
                  isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-muted-foreground/10',
                )}
                aria-label="Nested Safes"
                data-testid="nested-safes-button"
              />
            }
          >
            <Track
              {...NESTED_SAFE_EVENTS.OPEN_LIST}
              label={NESTED_SAFE_LABELS.space_safe_bar}
              mixpanelParams={{ [MixpanelEventParams.SAFE_SELECTOR_DROPDOWN]: 'Nested Safes' }}
            >
              <div className="relative flex items-center">
                <GitMerge className="size-5 text-muted-foreground" />
                {displayCount > 0 && (
                  <span className="absolute left-[13px] -top-[5px] flex size-[14px] items-center justify-center rounded-full bg-[rgba(18,255,128,0.1)] text-[10px] font-medium leading-none text-secondary-foreground">
                    {displayCount}
                  </span>
                )}
              </div>
            </Track>
          </TooltipTrigger>
          <TooltipContent>{isDisabled ? 'Nested Safes are not allowed in this screen' : 'Nested Safes'}</TooltipContent>
        </Tooltip>
      </div>

      {popover}
    </>
  )
}
