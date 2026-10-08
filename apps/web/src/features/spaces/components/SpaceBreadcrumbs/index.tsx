import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { BreadcrumbItem } from '@/components/common/Breadcrumbs/BreadcrumbItem'
import { useParentSafe } from '@/hooks/useParentSafe'
import { useCurrentSpaceId, useIsQualifiedSafe } from '@/features/spaces'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { SpaceBreadcrumbsView } from '@views/features/spaces/components/SpaceBreadcrumbs/SpaceBreadcrumbsView'

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
    <SpaceBreadcrumbsView
      spaceId={spaceId}
      spaceName={space?.name}
      showCurrentSafe={!parentSafe}
      renderCurrentSafe={(title) => <BreadcrumbItem title={title} address={safeAddress} />}
    />
  )
}

export default SpaceBreadcrumbs
