import { useEffect, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'
import { cn } from '@/utils/cn'

/** Reports sidebar open/collapsed state to parent without interfering with internal state. */
const SidebarStateReporter = ({ onOpenChange }: { onOpenChange?: (open: boolean) => void }): null => {
  const { open } = useSidebar()
  useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])
  return null
}

export type SpacesEnhancedSidebarViewProps = {
  isDrawerOpen?: boolean
  onDrawerClose?: () => void
  onOpenChange?: (open: boolean) => void
  isContainedInDrawer: boolean
  isDarkMode: boolean
  children: ReactNode
}

export const SpacesEnhancedSidebarView = ({
  isDrawerOpen,
  onDrawerClose,
  onOpenChange,
  isContainedInDrawer,
  isDarkMode,
  children,
}: SpacesEnhancedSidebarViewProps): ReactElement => {
  const spacesSidebarWidth = 'min(230px, 100%)'
  const spacesSidebarIconWidth = '34px'

  return (
    <SidebarProvider
      open={isContainedInDrawer ? true : undefined}
      openMobile={isDrawerOpen}
      onOpenMobileChange={(open) => !open && onDrawerClose?.()}
      style={
        {
          '--sidebar-width': spacesSidebarWidth,
          '--sidebar-width-icon': spacesSidebarIconWidth,
        } as CSSProperties
      }
      className={cn('shadcn-scope', isDarkMode && 'dark', isContainedInDrawer && 'h-dvh')}
    >
      <SidebarStateReporter onOpenChange={onOpenChange} />
      {children}
    </SidebarProvider>
  )
}
