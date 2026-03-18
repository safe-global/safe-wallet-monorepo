import { useEffect, type CSSProperties, type ReactElement } from 'react'
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { EnhancedSidebar } from './index'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { getNonDeclinedSpaces } from '@/features/spaces/utils'
import { useSidebarHydrated } from './hooks/useSidebarHydrated'
import { SidebarSkeleton } from './SidebarSkeleton'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'

interface SpacesEnhancedSidebarProps {
  /** When true (e.g. parent drawer is open on small screens), the mobile Sheet is open. */
  isDrawerOpen?: boolean
  /** Called when the mobile Sheet is closed so the parent can sync (e.g. close the drawer). */
  onDrawerClose?: () => void
  /** Called when the sidebar expands or collapses (icon mode). */
  onOpenChange?: (open: boolean) => void
}

/** Reports sidebar open/collapsed state to parent without interfering with internal state. */
const SidebarStateReporter = ({ onOpenChange }: { onOpenChange?: (open: boolean) => void }): null => {
  const { open } = useSidebar()
  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])
  return null
}

export const SpacesEnhancedSidebar = ({
  isDrawerOpen,
  onDrawerClose,
  onOpenChange,
}: SpacesEnhancedSidebarProps = {}): ReactElement => {
  const isHydrated = useSidebarHydrated()
  const spacesSidebarWidth = 'min(230px, 100%)'

  return (
    <SidebarProvider
      openMobile={isDrawerOpen}
      onOpenMobileChange={(open) => !open && onDrawerClose?.()}
      style={{ '--sidebar-width': spacesSidebarWidth } as CSSProperties}
    >
      <SidebarStateReporter onOpenChange={onOpenChange} />
      {isHydrated ? <HydratedSidebar /> : <SidebarSkeleton />}
    </SidebarProvider>
  )
}

const HydratedSidebar = (): ReactElement => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const spaceId = useCurrentSpaceId()
  const isSpaceRoute = useIsSpaceRoute()

  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData: spaces } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })

  const selectedSpace = spaces?.find((space) => space.id === Number(spaceId))
  const nonDeclinedSpaces = getNonDeclinedSpaces(currentUser, spaces ?? [])

  const spaceName = selectedSpace?.name ?? ''
  const spaceInitial = spaceName.charAt(0).toUpperCase()

  const sidebarType = isSpaceRoute ? 'spaces' : 'safe'

  return (
    <EnhancedSidebar
      type={sidebarType}
      spaceName={spaceName}
      spaceInitial={spaceInitial}
      selectedSpace={selectedSpace}
      spaces={nonDeclinedSpaces}
    />
  )
}
