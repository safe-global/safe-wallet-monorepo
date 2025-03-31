import { Tooltip, IconButton, SvgIcon, Badge, Typography } from '@mui/material'
import { skipToken } from '@reduxjs/toolkit/query'
import { useState } from 'react'
import type { ReactElement } from 'react'

import NestedSafesIcon from '@/public/images/sidebar/nested-safes-icon.svg'
import { NestedSafesPopover } from '@/components/sidebar/NestedSafesPopover'
import { useGetOwnedSafesQuery } from '@/store/slices'
import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { FEATURES } from '@/utils/chains'

import headerCss from '@/components/sidebar/SidebarHeader/styles.module.css'
import css from './styles.module.css'

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
  const { data } = useGetOwnedSafesQuery(isEnabled && safeAddress ? { chainId, ownerAddress: safeAddress } : skipToken)
  const nestedSafes = data?.safes ?? []

  if (!isEnabled || !safe.deployed) {
    return null
  }

  const onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const onClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Tooltip title="Nested Safes" placement="top">
        <Badge invisible={nestedSafes.length > 0} variant="dot" className={css.badge}>
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
            {nestedSafes.length > 0 && (
              <Typography component="span" variant="caption" className={css.count}>
                {nestedSafes.length}
              </Typography>
            )}
          </IconButton>
        </Badge>
      </Tooltip>
      <NestedSafesPopover anchorEl={anchorEl} onClose={onClose} nestedSafes={nestedSafes} />
    </>
  )
}
