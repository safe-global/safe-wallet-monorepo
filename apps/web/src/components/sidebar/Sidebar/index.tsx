import ChevronRight from '@mui/icons-material/ChevronRight'
import { Box, Divider, Drawer } from '@mui/material'
import { useCallback, useState, type ReactElement } from 'react'

import IndexingStatus from '@/components/sidebar/IndexingStatus'
import SidebarFooter from '@/components/sidebar/SidebarFooter'
import SidebarHeader from '@/components/sidebar/SidebarHeader'
import SidebarNavigation from '@/components/sidebar/SidebarNavigation'

import ChainIndicator from '@/components/common/ChainIndicator'
import MyAccounts from '@/features/myAccounts'
import SafenetSidebarHeader from '@/features/safenet/components/SafenetSidebarHeader'
import useIsSafenetEnabled from '@/features/safenet/hooks/useIsSafenetEnabled'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import css from './styles.module.css'

const Sidebar = (): ReactElement => {
  const isSafenetEnabled = useIsSafenetEnabled()
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)

  const onDrawerToggle = useCallback(() => {
    setIsDrawerOpen((isOpen) => {
      trackEvent({ ...OVERVIEW_EVENTS.SIDEBAR, label: isOpen ? 'Close' : 'Open' })

      return !isOpen
    })
  }, [])

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  return (
    <div data-testid="sidebar-container" className={css.container}>
      <div className={css.scroll}>
        {isSafenetEnabled ? <SafenetSidebarHeader /> : <ChainIndicator showLogo={false} />}

        {/* Open the safes list */}
        <button data-testid="open-safes-icon" className={css.drawerButton} onClick={onDrawerToggle}>
          <ChevronRight />
        </button>

        {/* Address, balance, copy button, etc */}
        <SidebarHeader />

        <Divider />

        {/* Nav menu */}
        <SidebarNavigation />

        <Box
          sx={{
            flex: 1,
          }}
        />

        <Divider flexItem />

        {/* What's new + Need help? */}
        <SidebarFooter />

        <Divider flexItem />

        <IndexingStatus />
      </div>
      <Drawer variant="temporary" anchor="left" open={isDrawerOpen} onClose={onDrawerToggle}>
        <div className={css.drawer}>
          <MyAccounts onLinkClick={closeDrawer} isSidebar></MyAccounts>
        </div>
      </Drawer>
    </div>
  )
}

export default Sidebar
