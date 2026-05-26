import { SpacesEnhancedSidebar } from '@/features/spaces/components/Sidebar/SpacesEnhancedSidebar'
import { useRouter } from 'next/router'
import { useEffect, type ReactElement } from 'react'
import { IconButton, Drawer, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import DoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import DoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'

import classnames from 'classnames'
import css from './styles.module.css'
import useDebounce from '@safe-global/utils/hooks/useDebounce'
import { useIsSidebarRoute } from '@/hooks/useIsSidebarRoute'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { useDarkMode } from '@/hooks/useDarkMode'

type SideDrawerProps = {
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
  onSidebarOpenChange?: (open: boolean) => void
}

const SideDrawer = ({ isOpen, onToggle, onSidebarOpenChange }: SideDrawerProps): ReactElement => {
  const { breakpoints } = useTheme()
  const isSmallScreen = useMediaQuery(breakpoints.down('md'))
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
    <>
      <Drawer
        variant={isSmallScreen ? 'temporary' : 'persistent'}
        anchor="left"
        open={isOpen}
        onClose={() => onToggle(false)}
        sx={{
          // fixes a bug on small screens where the drawer is not visible,
          // but it steals all the events from the rest of the page
          position: 'relative',
          '& .MuiPaper-root': {
            zIndex: 1250,
            ...(isTabletDrawer && {
              height: '100dvh',
              maxHeight: '100dvh',
              backgroundColor: 'transparent',
              backgroundImage: 'none',
              boxShadow: 'none',
              borderRight: 0,
              overflow: 'visible',
              display: 'flex',
            }),
          },
        }}
        className={smDrawerHidden ? css.smDrawerHidden : undefined}
      >
        <aside className={isTabletDrawer ? 'flex h-dvh' : undefined}>
          {isTabletDrawer ? (
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
          )}
        </aside>
      </Drawer>

      {showSidebarToggle && (
        <div className={classnames(css.sidebarTogglePosition, isOpen && css.sidebarOpen)}>
          <div className={css.sidebarToggle} role="button" onClick={() => onToggle(!isOpen)}>
            <IconButton aria-label="collapse sidebar" size="small" disableRipple>
              {isOpen ? <DoubleArrowLeftIcon fontSize="inherit" /> : <DoubleArrowRightIcon fontSize="inherit" />}
            </IconButton>
          </div>
        </div>
      )}
    </>
  )
}

export default SideDrawer
