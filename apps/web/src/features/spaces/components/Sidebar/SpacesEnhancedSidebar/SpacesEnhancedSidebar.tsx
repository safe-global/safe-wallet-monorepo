import { useEffect, useState, type CSSProperties, type ReactElement } from 'react'
import { useRouter } from 'next/router'
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { EnhancedSidebar } from '../index'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { getNonDeclinedSpaces } from '@/features/spaces/utils'
import type { SpaceItem } from '../types'
import { getQuerySpaceId } from '../utils'
import { useSidebarHydrated } from '../hooks/useSidebarHydrated'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import useIsQualifiedSafe from '@/features/spaces/hooks/useIsQualifiedSafe'
import { SidebarSkeleton } from '../SidebarSkeleton'
import { cn } from '@/utils/cn'
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
  isContainedInDrawer = false,
}: SpacesEnhancedSidebarProps = {}): ReactElement => {
  const isHydrated = useSidebarHydrated()
  const isDarkMode = useDarkMode()
  const spacesSidebarWidth = 'min(230px, 100%)'

  return (
    <SidebarProvider
      open={isContainedInDrawer ? true : undefined}
      openMobile={isDrawerOpen}
      onOpenMobileChange={(open) => !open && onDrawerClose?.()}
      style={{ '--sidebar-width': spacesSidebarWidth } as CSSProperties}
      className={cn('shadcn-scope', isDarkMode && 'dark', isContainedInDrawer && 'h-dvh')}
    >
      <SidebarStateReporter onOpenChange={onOpenChange} />
      {isHydrated ? (
        <HydratedSidebar contained={isContainedInDrawer} />
      ) : (
        <SidebarSkeleton contained={isContainedInDrawer} />
      )}
    </SidebarProvider>
  )
}

const HydratedSidebar = ({ contained = false }: { contained?: boolean }): ReactElement => {
  const router = useRouter()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const resolvedSpaceId = useCurrentSpaceId()
  const isSpaceRoute = useIsSpaceRoute()
  const [addedToSpace, setAddedToSpace] = useState<SpaceItem | undefined>()
  const isQualifiedSafe = useIsQualifiedSafe()

  const { currentData: currentUser, isLoading: isUserLoading } = useUsersGetWithWalletsV1Query(undefined, {
    skip: !isUserSignedIn,
  })
  const { currentData: spaces, isLoading: isSpacesLoading } = useSpacesGetV1Query(undefined, {
    skip: !isUserSignedIn,
  })

  const isLoadingData = isUserSignedIn && (isUserLoading || isSpacesLoading)

  const spaceIdForSidebarSelection = isSpaceRoute ? resolvedSpaceId : getQuerySpaceId(router.query)

  const selectedSpace =
    spaceIdForSidebarSelection != null ? spaces?.find((space) => space.uuid === spaceIdForSidebarSelection) : undefined

  const nonDeclinedSpaces = getNonDeclinedSpaces(currentUser, spaces ?? [])

  const qualifiedSpaceId = isQualifiedSafe ? resolvedSpaceId : null
  const qualifiedSpace = qualifiedSpaceId != null ? spaces?.find((space) => space.uuid === qualifiedSpaceId) : undefined

  const effectiveSelectedSpace = selectedSpace ?? addedToSpace ?? qualifiedSpace

  const sidebarType = isSpaceRoute ? 'spaces' : 'safe'

  return (
    <EnhancedSidebar
      contained={contained}
      type={sidebarType}
      selectedSpace={effectiveSelectedSpace}
      spaces={nonDeclinedSpaces}
      onSpaceAdded={setAddedToSpace}
      isLoading={isLoadingData}
    />
  )
}
