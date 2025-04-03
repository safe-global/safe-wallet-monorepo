import { useRouter } from 'next/router'
import css from './styles.module.css'
import { IconButton, SvgIcon, Typography } from '@mui/material'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import SpaceIcon from '@/public/images/spaces/space.svg'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useSpaceSafesGetV1Query, useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/features/spaces/components/InitialsAvatar'
import { BreadcrumbItem } from '@/components/common/Breadcrumbs/BreadcrumbItem'
import { useParentSafe } from '@/hooks/useParentSafe'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import useChainId from '@/hooks/useChainId'
import { useMemo } from 'react'

const SpaceBreadcrumbs = () => {
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const { pathname } = useRouter()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn || !spaceId })
  const { currentData: safes } = useSpaceSafesGetV1Query(
    { spaceId: Number(spaceId) },
    { skip: !isUserSignedIn || !spaceId },
  )
  const safeAddress = useSafeAddressFromUrl()
  const chainId = useChainId()
  const parentSafe = useParentSafe()
  const isSpaceRoute = pathname.startsWith(AppRoutes.spaces.index) || pathname.startsWith(AppRoutes.welcome.spaces)

  const isSafePartOfSpace = useMemo(
    () => safes && Object.entries(safes.safes).some((safe) => safe[0] === chainId && safe[1].includes(safeAddress)),
    [chainId, safeAddress, safes],
  )

  if (!isUserSignedIn || !spaceId || isSpaceRoute || !space || !isSpacesFeatureEnabled || !isSafePartOfSpace) {
    return null
  }

  return (
    <>
      <Track {...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE} label={SPACE_LABELS.space_breadcrumbs}>
        <Link href={{ pathname: AppRoutes.welcome.spaces }} passHref>
          <IconButton size="small">
            <SvgIcon component={SpaceIcon} inheritViewBox sx={{ fill: 'none' }} fontSize="small" color="primary" />
          </IconButton>
        </Link>
      </Track>

      <Typography variant="body2">/</Typography>

      <Track {...SPACE_EVENTS.OPEN_SPACE_DASHBOARD} label={SPACE_LABELS.space_breadcrumbs}>
        <Link href={{ pathname: AppRoutes.spaces.index, query: { spaceId } }} passHref className={css.spaceName}>
          <InitialsAvatar name={space.name} size="xsmall" />
          <Typography variant="body2" fontWeight="bold">
            {space.name}
          </Typography>
        </Link>
      </Track>

      <Typography variant="body2">/</Typography>

      {/* In case the nested breadcrumbs are not rendered we want to show the current safe address */}
      {!parentSafe && <BreadcrumbItem title="Current Safe" address={safeAddress} />}
    </>
  )
}

export default SpaceBreadcrumbs
