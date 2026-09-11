import css from './styles.module.css'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import SpaceIcon from '@/public/images/spaces/space.svg'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import InitialsAvatar from '@/components/common/InitialsAvatar'
import { BreadcrumbItem } from '@/components/common/Breadcrumbs/BreadcrumbItem'
import { useParentSafe } from '@/hooks/useParentSafe'
import { useCurrentSpaceId, useIsQualifiedSafe } from '@/features/spaces'
import Track from '@/components/common/Track'
import { SPACE_EVENTS, SPACE_LABELS } from '@/services/analytics/events/spaces'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'

const SpaceBreadcrumbs = () => {
  const isQualifiedSafe = useIsQualifiedSafe()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: space } = useSpacesGetOneV1Query({ id: spaceId ?? '' }, { skip: !isUserSignedIn || !spaceId })

  const safeAddress = useSafeAddressFromUrl()
  const parentSafe = useParentSafe()

  if (!isQualifiedSafe) {
    return null
  }

  return (
    <>
      <Track {...SPACE_EVENTS.OPEN_SPACE_LIST_PAGE} label={SPACE_LABELS.space_breadcrumbs}>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Workspaces"
          render={<Link href={{ pathname: AppRoutes.welcome.spaces }} />}
        >
          <SpaceIcon className="size-4 fill-none text-[var(--color-primary-main)]" />
        </Button>
      </Track>

      <Typography variant="paragraph-small">/</Typography>

      {space && (
        <Track {...SPACE_EVENTS.OPEN_SPACE_DASHBOARD} label={SPACE_LABELS.space_breadcrumbs}>
          <Link href={{ pathname: AppRoutes.spaces.index, query: { spaceId } }} className={css.spaceName}>
            <InitialsAvatar name={space.name} size="xsmall" />
            <Typography variant="paragraph-small-bold">{space.name}</Typography>
          </Link>
        </Track>
      )}

      <Typography variant="paragraph-small">/</Typography>

      {/* In case the nested breadcrumbs are not rendered we want to show the current safe address */}
      {!parentSafe && <BreadcrumbItem title="Current Safe" address={safeAddress} />}
    </>
  )
}

export default SpaceBreadcrumbs
