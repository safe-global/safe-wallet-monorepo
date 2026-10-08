import { SpacesEnhancedSidebar } from '@/features/spaces'
import { useRouter } from 'next/router'
import { useEffect, type ReactElement } from 'react'

import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useIsSidebarRoute } from '@/hooks/useIsSidebarRoute'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useIsBelowMd, useMediaQuery } from '@/hooks/useMediaQuery'
import { SideDrawerView } from '@views/components/common/PageLayout/SideDrawerView'

type SideDrawerProps = {
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
  onSidebarOpenChange?: (open: boolean) => void
  isSidebarExpanded?: boolean
}

const SideDrawer = ({
  isOpen,
  onToggle,
  onSidebarOpenChange,
  isSidebarExpanded = true,
}: SideDrawerProps): ReactElement => {
  const isSmallScreen = useIsBelowMd()
  const isTabletDrawer = useMediaQuery('(min-width:768px) and (max-width:899.95px)')
  const [, isSafeAppRoute] = useIsSidebarRoute()
  const isDarkMode = useDarkMode()

  const showSidebarToggle = isSafeAppRoute && !isSmallScreen
  // Keep the sidebar hidden on small screens via CSS until we collapse it via JS.
  // With a small delay to avoid flickering.
  const smDrawerHidden = useDebounce(!isSmallScreen, 300)
  const router = useRouter()

  useEffect(() => {
    const closeSidebar = isSmallScreen || isSafeAppRoute
    onToggle(!closeSidebar)
  }, [isSmallScreen, isSafeAppRoute, onToggle])

  // Close the drawer whenever the route changes
  useEffect(() => {
    const onRouteChange = () => isSmallScreen && onToggle(false)
    router.events.on('routeChangeStart', onRouteChange)

    return () => {
      router.events.off('routeChangeStart', onRouteChange)
    }
  }, [onToggle, router, isSmallScreen])

  return (
    <SideDrawerView
      isOpen={isOpen}
      onToggle={onToggle}
      isSmallScreen={isSmallScreen}
      isTabletDrawer={isTabletDrawer}
      isDarkMode={isDarkMode}
      smDrawerHidden={smDrawerHidden}
      showSidebarToggle={showSidebarToggle}
      isSidebarExpanded={isSidebarExpanded}
      sidebar={
        isTabletDrawer ? (
          <SpacesEnhancedSidebar
            isDrawerOpen={isOpen}
            onDrawerClose={() => onToggle(false)}
            onOpenChange={onSidebarOpenChange}
            isContainedInDrawer
          />
        ) : (
          <SpacesEnhancedSidebar
            isDrawerOpen={isOpen}
            onDrawerClose={() => onToggle(false)}
            onOpenChange={onSidebarOpenChange}
          />
        )
      }
    />
  )
}

export default SideDrawer
