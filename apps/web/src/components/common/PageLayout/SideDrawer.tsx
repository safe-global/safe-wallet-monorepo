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

type SideDrawerProps = {
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
}

const SideDrawer = ({ isOpen, onToggle }: SideDrawerProps): ReactElement => {
  const { breakpoints } = useTheme()
  const isSmallScreen = useMediaQuery(breakpoints.down('md'))
  const [, isSafeAppRoute] = useIsSidebarRoute()

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
          // z-index to make the sidebar appear above the current header
          '& .MuiPaper-root': { zIndex: 9000 },
        }}
        className={smDrawerHidden ? css.smDrawerHidden : undefined}
      >
        <aside>
          <SpacesEnhancedSidebar isDrawerOpen={isOpen} onDrawerClose={() => onToggle(false)} />
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
