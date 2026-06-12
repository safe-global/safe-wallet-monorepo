import { SpacesEnhancedSidebar } from '@/features/spaces/components/Sidebar/SpacesEnhancedSidebar'
import { useRouter } from 'next/router'
import { useEffect, type ReactElement } from 'react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'

import classnames from 'classnames'
import css from './styles.module.css'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useIsSidebarRoute } from '@/hooks/useIsSidebarRoute'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { useDarkMode } from '@/hooks/useDarkMode'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useIsBelowMd, useMediaQuery } from '@/hooks/useMediaQuery'

type SideDrawerProps = {
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
  onSidebarOpenChange?: (open: boolean) => void
}

const SideDrawer = ({ isOpen, onToggle, onSidebarOpenChange }: SideDrawerProps): ReactElement => {
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

  const sidebar = isTabletDrawer ? (
    <ShadcnProvider dark={isDarkMode} className="h-full">
      <SpacesEnhancedSidebar
        isDrawerOpen={isOpen}
        onDrawerClose={() => onToggle(false)}
        onOpenChange={onSidebarOpenChange}
        isContainedInDrawer
      />
    </ShadcnProvider>
  ) : (
    <SpacesEnhancedSidebar
      isDrawerOpen={isOpen}
      onDrawerClose={() => onToggle(false)}
      onOpenChange={onSidebarOpenChange}
    />
  )

  return (
    <>
      {isSmallScreen ? (
        // Below `md` the drawer is a temporary overlay with a backdrop / focus trap.
        <Sheet open={isOpen} onOpenChange={onToggle}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className={classnames(
              'w-auto max-w-none border-0 p-0',
              isTabletDrawer &&
                'flex h-dvh max-h-dvh overflow-visible bg-transparent bg-none shadow-none [&]:bg-transparent',
            )}
          >
            <aside className={isTabletDrawer ? 'flex h-dvh' : undefined}>{sidebar}</aside>
          </SheetContent>
        </Sheet>
      ) : (
        // From `md` up the drawer is persistent: no backdrop, main content stays interactive.
        <aside
          className={classnames(
            'fixed inset-y-0 left-0 z-[1150]',
            !isOpen && 'hidden',
            smDrawerHidden ? css.smDrawerHidden : undefined,
          )}
        >
          {sidebar}
        </aside>
      )}

      {showSidebarToggle && (
        <div className={classnames(css.sidebarTogglePosition, isOpen && css.sidebarOpen)}>
          <div className={css.sidebarToggle} role="button" onClick={() => onToggle(!isOpen)}>
            <Button variant="ghost" size="icon-sm" aria-label="collapse sidebar">
              {isOpen ? <ChevronsLeft className="size-5" /> : <ChevronsRight className="size-5" />}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

export default SideDrawer
