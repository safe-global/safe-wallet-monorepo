import { useState } from 'react'
import type { ReactElement } from 'react'
import { GitMerge } from 'lucide-react'

import { NestedSafesPopover } from '@/components/sidebar/NestedSafesPopover'
import { useOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useNestedSafesVisibility } from '@/hooks/useNestedSafesVisibility'
import { FEATURES } from '@safe-global/utils/utils/chains'
import Track from '@/components/common/Track'
import { NESTED_SAFE_EVENTS, NESTED_SAFE_LABELS } from '@/services/analytics/events/nested-safes'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

function SpaceNestedSafesButton(): ReactElement | null {
  const { safe } = useSafeInfo()
  const { chainId } = safe
  const safeAddress = safe.address.value
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const { currentData: ownedSafes } = useOwnersGetAllSafesByOwnerV2Query(
    { ownerAddress: safeAddress },
    { skip: !isEnabled || !safeAddress },
  )
  const rawNestedSafes = ownedSafes?.[chainId] ?? []
  const { visibleSafes, allSafesWithStatus, hasCompletedCuration, isLoading, startFiltering, hasStarted } =
    useNestedSafesVisibility(rawNestedSafes, chainId)

  if (!isEnabled || !safe.deployed) {
    return null
  }

  const displayCount = hasStarted && !isLoading ? visibleSafes.length : rawNestedSafes.length

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    startFiltering()
  }

  const onClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <div className="flex self-stretch items-stretch sm:order-1 rounded-lg bg-card shadow-[0px_4px_20px_0px_rgba(0,0,0,0.03)]">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={onClick}
                className="relative flex items-center border-0 rounded-lg bg-transparent px-2 m-1 cursor-pointer hover:bg-muted/30 transition-colors"
                aria-label="Nested Safes"
                data-testid="space-nested-safes-button"
              />
            }
          >
            <Track
              {...NESTED_SAFE_EVENTS.OPEN_LIST}
              label={NESTED_SAFE_LABELS.space_safe_bar}
              mixpanelParams={{ [MixpanelEventParams.SAFE_SELECTOR_DROPDOWN]: 'Nested Safes' }}
            >
              <div className="relative flex items-center">
                <GitMerge className="size-5" />
                {displayCount > 0 && (
                  <span className="absolute left-[13px] -top-[5px] flex size-[14px] items-center justify-center rounded-full bg-[rgba(18,255,128,0.1)] text-[10px] font-medium leading-none text-secondary-foreground">
                    {displayCount}
                  </span>
                )}
              </div>
            </Track>
          </TooltipTrigger>
          <TooltipContent>Nested Safes</TooltipContent>
        </Tooltip>
      </div>

      <NestedSafesPopover
        anchorEl={anchorEl}
        onClose={onClose}
        rawNestedSafes={rawNestedSafes}
        allSafesWithStatus={allSafesWithStatus}
        visibleSafes={visibleSafes}
        hasCompletedCuration={hasCompletedCuration}
        isLoading={isLoading}
        centered
      />
    </>
  )
}

export default SpaceNestedSafesButton
