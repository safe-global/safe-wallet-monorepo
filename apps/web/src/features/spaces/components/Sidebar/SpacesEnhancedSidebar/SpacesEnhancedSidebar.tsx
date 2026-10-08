import { type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { EnhancedSidebar } from '../index'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useCurrentSpaceId } from '../../../hooks/useCurrentSpaceId'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { getNonDeclinedSpaces } from '@/features/spaces/utils'
import { parseSpaceId } from '@/hooks/useUrlSpaceId'
import { useIsHydrated } from '@/hooks/useIsHydrated'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import useIsQualifiedSafe from '../../../hooks/useIsQualifiedSafe'
import { SidebarSkeleton } from '../SidebarSkeleton'
import { SpacesEnhancedSidebarView } from '@views/features/spaces/components/Sidebar/SpacesEnhancedSidebar/SpacesEnhancedSidebarView'
import { useDarkMode } from '@/hooks/useDarkMode'

interface SpacesEnhancedSidebarProps {
  /** When true (e.g. parent drawer is open on small screens), the mobile Sheet is open. */
  isDrawerOpen?: boolean
  /** Called when the mobile Sheet is closed so the parent can sync (e.g. close the drawer). */
  onDrawerClose?: () => void
  /** Called when the sidebar expands or collapses (icon mode). */
  onOpenChange?: (open: boolean) => void
  /** When true, render the desktop sidebar contained inside a parent drawer instead of fixed to the viewport. */
  isContainedInDrawer?: boolean
}

export const SpacesEnhancedSidebar = ({
  isDrawerOpen,
  onDrawerClose,
  onOpenChange,
  isContainedInDrawer = false,
}: SpacesEnhancedSidebarProps = {}): ReactElement => {
  const isHydrated = useIsHydrated()
  const isDarkMode = useDarkMode()

  return (
    <SpacesEnhancedSidebarView
      isDrawerOpen={isDrawerOpen}
      onDrawerClose={onDrawerClose}
      onOpenChange={onOpenChange}
      isContainedInDrawer={isContainedInDrawer}
      isDarkMode={isDarkMode}
    >
      {isHydrated ? (
        <HydratedSidebar contained={isContainedInDrawer} />
      ) : (
        <SidebarSkeleton contained={isContainedInDrawer} />
      )}
    </SpacesEnhancedSidebarView>
  )
}

const HydratedSidebar = ({ contained = false }: { contained?: boolean }): ReactElement => {
  const router = useRouter()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const resolvedSpaceId = useCurrentSpaceId()
  const isSpaceRoute = useIsSpaceRoute()
  const isQualifiedSafe = useIsQualifiedSafe()

  const { currentData: currentUser, isLoading: isUserLoading } = useUsersGetWithWalletsV1Query(undefined, {
    skip: !isUserSignedIn,
  })
  const { currentData: spaces, isLoading: isSpacesLoading } = useSpacesGetV1Query(undefined, {
    skip: !isUserSignedIn,
  })

  const isLoadingData = isUserSignedIn && (isUserLoading || isSpacesLoading)

  const spaceIdForSidebarSelection = isSpaceRoute ? resolvedSpaceId : parseSpaceId(router.query.spaceId)

  const selectedSpace =
    spaceIdForSidebarSelection != null ? spaces?.find((space) => space.uuid === spaceIdForSidebarSelection) : undefined

  const nonDeclinedSpaces = getNonDeclinedSpaces(currentUser, spaces ?? [])

  const qualifiedSpaceId = isQualifiedSafe ? resolvedSpaceId : null
  const qualifiedSpace = qualifiedSpaceId != null ? spaces?.find((space) => space.uuid === qualifiedSpaceId) : undefined

  const effectiveSelectedSpace = selectedSpace ?? qualifiedSpace

  const sidebarType = isSpaceRoute ? 'spaces' : 'safe'

  return (
    <EnhancedSidebar
      contained={contained}
      type={sidebarType}
      selectedSpace={effectiveSelectedSpace}
      spaces={nonDeclinedSpaces}
      isLoading={isLoadingData}
    />
  )
}
