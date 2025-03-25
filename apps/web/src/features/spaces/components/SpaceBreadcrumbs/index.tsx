import { useRouter } from 'next/router'
import css from './styles.module.css'
import { IconButton, Typography } from '@mui/material'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/features/spaces/components/InitialsAvatar'
import { BreadcrumbItem } from '@/components/common/Breadcrumbs/BreadcrumbItem'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useParentSafe } from '@/hooks/useParentSafe'

const SpaceBreadcrumbs = () => {
  const { query, pathname } = useRouter()
  const spaceId = Array.isArray(query.spaceId) ? query.spaceId[0] : query.spaceId
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn })
  const { safeAddress } = useSafeInfo()
  const parentSafe = useParentSafe()
  const isSpaceRoute = pathname.startsWith(AppRoutes.spaces.index)

  if (!isUserSignedIn || !spaceId || isSpaceRoute || !space) {
    return null
  }

  return (
    <>
      <Link href={{ pathname: AppRoutes.welcome.spaces }} passHref>
        <IconButton size="small">
          <AccountBalanceIcon fontSize="small" color="primary" />
        </IconButton>
      </Link>

      <Typography variant="body2">/</Typography>

      <Link href={{ pathname: AppRoutes.spaces.index, query: { spaceId } }} passHref className={css.spaceName}>
        <InitialsAvatar name={space.name} size="xsmall" />
        <Typography variant="body2" fontWeight="bold">
          {space.name}
        </Typography>
      </Link>

      <Typography variant="body2">/</Typography>

      {/* In case the nested breadcrumbs are not rendered we want to show the current safe address */}
      {!parentSafe && <BreadcrumbItem title="Current Safe" address={safeAddress} />}
    </>
  )
}

export default SpaceBreadcrumbs
