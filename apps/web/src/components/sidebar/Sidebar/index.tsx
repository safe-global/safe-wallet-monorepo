import { useCallback, useState, type ReactElement } from 'react'
import { ChevronRight } from 'lucide-react'

import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import ChainIndicator from '@/components/common/ChainIndicator'
import SidebarHeader from '@/components/sidebar/SidebarHeader'
import SidebarNavigation from '@/components/sidebar/SidebarNavigation'
import SidebarFooter from '@/components/sidebar/SidebarFooter'

import css from './styles.module.css'
import { trackEvent, OVERVIEW_EVENTS, MixpanelEventParams } from '@/services/analytics'
import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'

const Sidebar = (): ReactElement => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const { MyAccounts } = useLoadFeature(MyAccountsFeature)

  const onDrawerToggle = useCallback(() => {
    setIsDrawerOpen((isOpen) => {
      trackEvent(
        { ...OVERVIEW_EVENTS.SIDEBAR, label: isOpen ? 'Close' : 'Open' },
        { [MixpanelEventParams.SIDEBAR_ELEMENT]: isOpen ? 'Close Wallets' : 'Expand Wallets' },
      )

      return !isOpen
    })
  }, [])

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), [])

  return (
    <div data-testid="sidebar-container" className={css.container}>
      <div className={css.scroll}>
        <ChainIndicator showLogo={false} onlyLogo />

        {/* Open the safes list */}
        <button data-testid="open-safes-icon" className={css.drawerButton} onClick={onDrawerToggle}>
          <ChevronRight />
        </button>

        {/* Address, balance, copy button, etc */}
        <SidebarHeader />

        {/* Nav menu */}
        <SidebarNavigation />

        <div className="flex-1" />

        <Separator className="bg-[var(--color-background-main)]" />

        <SidebarFooter />
      </div>
      <Sheet
        open={isDrawerOpen}
        onOpenChange={(open) => {
          if (!open) onDrawerToggle()
        }}
      >
        <SheetContent side="left" showCloseButton={false} className="w-[550px] max-w-[90vw] gap-0 p-0">
          <div className={css.drawer}>
            <MyAccounts onLinkClick={closeDrawer} isSidebar></MyAccounts>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default Sidebar
