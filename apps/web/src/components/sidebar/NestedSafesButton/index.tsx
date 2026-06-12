import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Typography } from '@/components/ui/typography'
import { useState } from 'react'
import type { ReactElement } from 'react'
import { cn } from '@/utils/cn'

import NestedSafesIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import { NestedSafesPopover } from '@/components/sidebar/NestedSafesPopover'
import { useOwnersGetSafesByOwnerV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useNestedSafesVisibility } from '@/hooks/useNestedSafesVisibility'

import headerCss from '@/components/sidebar/SidebarHeader/styles.module.css'
import css from './styles.module.css'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function NestedSafesButton({
  chainId,
  safeAddress,
}: {
  chainId: string
  safeAddress: string
}): ReactElement | null {
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { safe } = useSafeInfo()
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const { currentData: ownedSafes } = useOwnersGetSafesByOwnerV1Query(
    { chainId, ownerAddress: safeAddress },
    { skip: !isEnabled || !safeAddress },
  )
  const rawNestedSafes = ownedSafes?.safes ?? []
  const { visibleSafes, allSafesWithStatus, hasCompletedCuration, isLoading, startFiltering, hasStarted } =
    useNestedSafesVisibility(rawNestedSafes, chainId)

  if (!isEnabled || !safe.deployed) {
    return null
  }

  // Show raw count before validation, visible count after
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
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              className={cn(headerCss.iconButton, 'relative w-auto min-w-8', anchorEl && 'bg-[#f2fecd]')}
              onClick={onClick}
            >
              {displayCount === 0 && <span className={css.badge} />}
              <NestedSafesIcon className="size-4 text-[var(--color-primary-main)]" />
              {displayCount > 0 && (
                <Typography variant="paragraph-mini" className={css.count}>
                  {displayCount}
                </Typography>
              )}
            </button>
          }
        />
        <TooltipContent side="top">Nested Safes</TooltipContent>
      </Tooltip>
      <NestedSafesPopover
        anchorEl={anchorEl}
        onClose={onClose}
        rawNestedSafes={rawNestedSafes}
        allSafesWithStatus={allSafesWithStatus}
        visibleSafes={visibleSafes}
        hasCompletedCuration={hasCompletedCuration}
        isLoading={isLoading}
      />
    </>
  )
}
