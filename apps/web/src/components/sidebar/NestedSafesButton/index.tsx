import { Tooltip, IconButton, SvgIcon, Badge, Typography } from '@mui/material'
import { useState } from 'react'
import type { ReactElement } from 'react'

import NestedSafesIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import { NestedSafesPopover } from '@/components/sidebar/NestedSafesPopover'
import { useOwnersGetAllSafesByOwnerV2Query } from '@safe-global/store/gateway/AUTO_GENERATED/owners'
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
      <Tooltip title="Nested Safes" placement="top">
        <Badge invisible={displayCount > 0} variant="dot" className={css.badge}>
          <IconButton
            className={headerCss.iconButton}
            sx={{
              width: 'auto !important',
              minWidth: '32px !important',
              backgroundColor: anchorEl ? '#f2fecd !important' : undefined,
            }}
            onClick={onClick}
          >
            <SvgIcon component={NestedSafesIcon} inheritViewBox color="primary" fontSize="small" />
            {displayCount > 0 && (
              <Typography component="span" variant="caption" className={css.count}>
                {displayCount}
              </Typography>
            )}
          </IconButton>
        </Badge>
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
