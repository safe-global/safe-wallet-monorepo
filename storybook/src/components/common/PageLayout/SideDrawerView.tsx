import type { ReactElement, ReactNode } from 'react'
import { ChevronsLeft, ChevronsRight } from 'lucide-react'

import classnames from 'classnames'
import css from './styles.module.css'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export type SideDrawerViewProps = {
  isOpen: boolean
  onToggle: (isOpen: boolean) => void
  isSmallScreen: boolean
  isTabletDrawer: boolean
  isDarkMode: boolean
  smDrawerHidden: boolean
  showSidebarToggle: boolean
  isSidebarExpanded: boolean
  sidebar: ReactNode
}

export function SideDrawerView({
  isOpen,
  onToggle,
  isSmallScreen,
  isTabletDrawer,
  isDarkMode,
  smDrawerHidden,
  showSidebarToggle,
  isSidebarExpanded,
  sidebar: sidebarContent,
}: SideDrawerViewProps): ReactElement {
  const sidebar = isTabletDrawer ? (
    <ShadcnProvider dark={isDarkMode} className="h-full">
      {sidebarContent}
    </ShadcnProvider>
  ) : (
    sidebarContent
  )

  return (
    <>
      {isSmallScreen ? (
        // Below `md` the drawer is a temporary overlay with a backdrop / focus trap.
        // `smDrawerHidden` is still true for the ~300ms after the viewport crosses below `md`, before
        // the effect above has collapsed the drawer. The Sheet's backdrop is a portal sibling of its
        // content, so it cannot be hidden with CSS the way the shared MUI Drawer was — keep the Sheet
        // closed for that window instead.
        <Sheet open={isOpen && !smDrawerHidden} onOpenChange={onToggle}>
          <SheetContent
            side="left"
            showCloseButton={false}
            size="auto"
            padding="none"
            className={classnames(
              // eslint-disable-next-line no-restricted-syntax -- border-0 removes base data-[side]:border-r; no borderless-sheet token
              'border-0',
              isTabletDrawer &&
                // eslint-disable-next-line no-restricted-syntax -- tablet drawer is a bespoke transparent full-height overlay
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
        <div
          className={classnames(
            css.sidebarTogglePosition,
            isOpen && (isSidebarExpanded ? css.sidebarOpen : css.sidebarCollapsed),
          )}
        >
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
